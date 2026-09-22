// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileReferenceHeader } from "../../src/components/storefront/MobileReferenceHeader";
import { BottomNav } from "../../src/components/storefront/BottomNav";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("storefront navigation actions", () => {
  it("keeps favorites separate from the menu and submits search by click and Enter", () => {
    const menu = vi.fn();
    const wishlist = vi.fn();
    const search = vi.fn();
    render(
      <MobileReferenceHeader
        searchQuery="ساعة"
        onSearchChange={vi.fn()}
        onSubmitSearch={search}
        cartCount={0}
        unreadNotificationsCount={0}
        onOpenCart={vi.fn()}
        onOpenNotifications={vi.fn()}
        onOpenMenu={menu}
        onOpenWishlist={wishlist}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "المفضلة" }));
    expect(wishlist).toHaveBeenCalledTimes(1);
    expect(menu).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "الرسائل والقائمة" }));
    fireEvent.click(screen.getByRole("button", { name: "عرض جميع الفئات" }));
    expect(menu).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "تنفيذ البحث" }));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(search).toHaveBeenCalledTimes(2);
    expect(
      (screen.getByRole("button", { name: "البحث بالكاميرا" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("opens categories through the page handler without navigating to empty search", () => {
    const activate = vi.fn();
    render(<BottomNav activeTab="home" setActiveTab={activate} cartCount={0} />);
    fireEvent.click(screen.getByRole("button", { name: "الفئات والتصنيفات" }));
    expect(activate).toHaveBeenCalledWith("categories");
    expect(navigate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "البحث", exact: true }));
    expect(navigate).toHaveBeenCalledWith({ to: "/search", search: { q: "" } });
  });
});
