import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Mutex } from "async-mutex";
import {
  BufferJSON,
  initAuthCreds,
  proto,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { config } from "./config.js";
import { decryptText, encryptText } from "./crypto.js";

const locks = new Map<string, Mutex>();

function sessionDir(sessionId: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) throw new Error("INVALID_SESSION_ID");
  const root = resolve(config.dataDir, "sessions");
  const target = resolve(root, sessionId);
  if (!target.startsWith(`${root}/`)) throw new Error("INVALID_SESSION_PATH");
  return target;
}

const fileName = (value: string) => value.replace(/\//g, "__").replace(/:/g, "-");

export async function useEncryptedAuthState(
  sessionId: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const folder = sessionDir(sessionId);
  await mkdir(folder, { recursive: true, mode: 0o700 });

  const withLock = async <T>(path: string, work: () => Promise<T>): Promise<T> => {
    let mutex = locks.get(path);
    if (!mutex) {
      mutex = new Mutex();
      locks.set(path, mutex);
    }
    return mutex.runExclusive(work);
  };

  const readData = async (file: string): Promise<any | null> => {
    const path = join(folder, fileName(file));
    return withLock(path, async () => {
      try {
        const encrypted = await readFile(path, "utf8");
        return JSON.parse(decryptText(encrypted), BufferJSON.reviver);
      } catch (error: any) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    });
  };

  const writeData = async (data: unknown, file: string): Promise<void> => {
    const path = join(folder, fileName(file));
    await withLock(path, async () => {
      const encoded = JSON.stringify(data, BufferJSON.replacer);
      await writeFile(path, encryptText(encoded), { encoding: "utf8", mode: 0o600 });
    });
  };

  const removeData = async (file: string): Promise<void> => {
    const path = join(folder, fileName(file));
    await withLock(path, async () => {
      await unlink(path).catch((error: any) => {
        if (error?.code !== "ENOENT") throw error;
      });
    });
  };

  const creds: AuthenticationCreds = (await readData("creds.json")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: Record<string, SignalDataTypeMap[typeof type]> = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}.json`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            }),
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            const typedCategory = category as keyof SignalDataTypeMap;
            const values = data[typedCategory];
            if (!values) continue;
            for (const id in values) {
              const value = values[id];
              tasks.push(
                value
                  ? writeData(value, `${category}-${id}.json`)
                  : removeData(`${category}-${id}.json`),
              );
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData(creds, "creds.json"),
  };
}
