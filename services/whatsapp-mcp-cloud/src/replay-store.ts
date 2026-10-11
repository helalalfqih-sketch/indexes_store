import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Mutex } from "async-mutex";
import { config } from "./config.js";

const mutex = new Mutex();
const file = join(config.dataDir, "oauth", "consumed-codes.json");

type Consumed = Record<string, number>;

async function readConsumed(): Promise<Consumed> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Consumed;
  } catch (error: any) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

export async function consumeAuthorizationCode(code: string, exp: number): Promise<void> {
  const digest = createHash("sha256").update(code).digest("hex");
  await mutex.runExclusive(async () => {
    const now = Math.floor(Date.now() / 1000);
    const consumed = await readConsumed();
    for (const [key, expires] of Object.entries(consumed)) {
      if (expires < now) delete consumed[key];
    }
    if (consumed[digest]) throw new Error("AUTHORIZATION_CODE_REPLAYED");
    consumed[digest] = exp;
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    const tmp = `${file}.tmp`;
    await writeFile(tmp, JSON.stringify(consumed), { encoding: "utf8", mode: 0o600 });
    await rename(tmp, file);
  });
}
