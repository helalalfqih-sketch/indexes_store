import { afterEach, describe, expect, it, vi } from "vitest";
import { createDeadlineCoordinator } from "@/lib/utils/deadline-coordinator";

afterEach(() => {
  vi.useRealTimers();
});

describe("deadline coordinator", () => {
  it("coalesces matching work and isolates an opened circuit to its key", async () => {
    vi.useFakeTimers();

    let finishWork: ((value: string) => void) | undefined;
    const work = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          finishWork = resolve;
        }),
    );
    const coordinator = createDeadlineCoordinator<string>({
      deadlineMs: 6_000,
      cooldownMs: 30_000,
      maxInFlight: 4,
    });

    const first = coordinator.run("default", work, "fallback");
    const second = coordinator.run("default", work, "fallback");
    await Promise.resolve();
    expect(work).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(6_000);
    await expect(first).resolves.toMatchObject({
      value: "fallback",
      degraded: true,
      reason: "timeout",
    });
    await expect(second).resolves.toMatchObject({
      value: "fallback",
      degraded: true,
      reason: "timeout",
    });

    const blockedWork = vi.fn(async () => "blocked");
    await expect(coordinator.run("default", blockedWork, "fallback")).resolves.toMatchObject({
      value: "fallback",
      degraded: true,
      reason: "circuit",
    });
    expect(blockedWork).not.toHaveBeenCalled();

    const otherTenantWork = vi.fn(async () => "fresh");
    await expect(coordinator.run("another-tenant", otherTenantWork, "fallback")).resolves.toEqual({
      value: "fresh",
      degraded: false,
      retryAfterMs: null,
    });
    expect(otherTenantWork).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);

    finishWork?.("late");
    await Promise.resolve();

    await expect(coordinator.run("default", blockedWork, "fallback")).resolves.toEqual({
      value: "blocked",
      degraded: false,
      retryAfterMs: null,
    });
    expect(blockedWork).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("caps distinct pending keys before a timeout can open the circuit", async () => {
    vi.useFakeTimers();
    const never = () => new Promise<string>(() => {});
    const coordinator = createDeadlineCoordinator<string>({
      deadlineMs: 6_000,
      cooldownMs: 30_000,
      maxInFlight: 2,
      recoverySlots: 0,
    });

    void coordinator.run("tenant-a", never, "fallback");
    void coordinator.run("tenant-b", never, "fallback");

    await expect(coordinator.run("tenant-c", never, "fallback")).resolves.toMatchObject({
      value: "fallback",
      degraded: true,
      reason: "capacity",
    });

    await vi.advanceTimersByTimeAsync(6_000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses a bounded half-open probe when the original work never settles", async () => {
    vi.useFakeTimers();
    const coordinator = createDeadlineCoordinator<string>({
      deadlineMs: 6_000,
      cooldownMs: 30_000,
      maxInFlight: 3,
      recoverySlots: 1,
    });

    const stalled = coordinator.run("tenant-a", () => new Promise<string>(() => {}), "fallback");
    await vi.advanceTimersByTimeAsync(6_000);
    await expect(stalled).resolves.toMatchObject({ degraded: true, reason: "timeout" });

    await vi.advanceTimersByTimeAsync(30_000);
    const healthyProbe = vi.fn(async () => "healthy");
    await expect(coordinator.run("tenant-b", healthyProbe, "fallback")).resolves.toEqual({
      value: "healthy",
      degraded: false,
      retryAfterMs: null,
    });
    expect(healthyProbe).toHaveBeenCalledTimes(1);

    await expect(
      coordinator.run("tenant-c", async () => "also-healthy", "fallback"),
    ).resolves.toEqual({ value: "also-healthy", degraded: false, retryAfterMs: null });
  });

  it("ignores a stale recovery failure after a newer probe restored the circuit", async () => {
    vi.useFakeTimers();
    const coordinator = createDeadlineCoordinator<string>({
      deadlineMs: 6_000,
      cooldownMs: 30_000,
      maxInFlight: 4,
      recoverySlots: 1,
    });

    const first = coordinator.run("tenant-a", () => new Promise<string>(() => {}), "fallback");
    await vi.advanceTimersByTimeAsync(6_000);
    await expect(first).resolves.toMatchObject({ degraded: true, reason: "timeout" });

    await vi.advanceTimersByTimeAsync(30_000);
    let rejectOldProbe: ((reason?: unknown) => void) | undefined;
    const oldProbe = coordinator.run(
      "tenant-a",
      () =>
        new Promise<string>((_resolve, reject) => {
          rejectOldProbe = reject;
        }),
      "fallback",
    );
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(6_000);
    await expect(oldProbe).resolves.toMatchObject({ degraded: true, reason: "timeout" });

    await vi.advanceTimersByTimeAsync(30_000);
    await expect(coordinator.run("tenant-a", async () => "restored", "fallback")).resolves.toEqual({
      value: "restored",
      degraded: false,
      retryAfterMs: null,
    });

    rejectOldProbe?.(new Error("late failure"));
    await Promise.resolve();

    const healthyWork = vi.fn(async () => "still-healthy");
    await expect(coordinator.run("tenant-a", healthyWork, "fallback")).resolves.toEqual({
      value: "still-healthy",
      degraded: false,
      retryAfterMs: null,
    });
    expect(healthyWork).toHaveBeenCalledTimes(1);
  });
});
