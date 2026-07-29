import fs from "node:fs";

function edit(path, transform) {
  const before = fs.readFileSync(path, "utf8");
  const after = transform(before);
  if (after === before) {
    console.log(`No change: ${path}`);
    return;
  }
  fs.writeFileSync(path, after);
  console.log(`Updated: ${path}`);
}

edit("src/components/optimized-image.tsx", (text) =>
  text.replace(
    "// @ts-ignore — fetchpriority is valid HTML5 but not yet in TS types",
    "// @ts-expect-error -- fetchpriority is supported by browsers before React typings expose it",
  ),
);

for (const path of [
  "src/lib/ai-agent.legacy.ts",
  "src/services/ai-agent/code-patcher.engine.ts",
  "src/services/ai-agent/patch-engine.service.ts",
]) {
  edit(path, (text) => text.split("[\\/\\\\]").join("[/\\\\]"));
}

edit("src/lib/quality/runtime/console-monitor.ts", (text) =>
  text.replace(
    "    } catch {}",
    "    } catch {\n      // Console arguments may contain circular or non-serializable values.\n    }",
  ),
);

edit("src/lib/use-favorites.ts", (text) =>
  text
    .replace(
      "      } catch {}",
      "      } catch {\n        // localStorage may be unavailable or full; keep the in-memory state.\n      }",
    )
    .replace(
      "      } catch {}",
      "      } catch {\n        // Ignore malformed or unavailable persisted favorites.\n      }",
    ),
);

edit("src/lib/quality/history.ts", (text) =>
  text
    .replace(
      '      return require("fs");',
      '      // eslint-disable-next-line @typescript-eslint/no-require-imports -- development-only lazy load prevents production fs bundling\n      return require("fs");',
    )
    .replace(
      '      return require("path");',
      '      // eslint-disable-next-line @typescript-eslint/no-require-imports -- development-only lazy load prevents production path bundling\n      return require("path");',
    ),
);

edit("src/lib/saas/billing.service.ts", (text) =>
  text.replace(
    `  async startCheckout() {
    throw new Error("Billing not configured. TODO: connect a provider in Phase D.");
    // eslint-disable-next-line @typescript-eslint/no-unreachable
    return { url: "" };
  }`,
    `  async startCheckout(
    _input: Parameters<BillingProvider["startCheckout"]>[0],
  ): Promise<{ url: string }> {
    throw new Error("Billing not configured. TODO: connect a provider in Phase D.");
  }`,
  ),
);

edit("src/routes/admin.stores.$tenantId.tsx", (text) =>
  text.replace(/\bmkMut\b/g, "useStoreMutation"),
);
