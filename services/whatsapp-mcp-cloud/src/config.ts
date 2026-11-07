import { z } from "zod";

const schema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    ORIGIN: z.string().url(),
    DATA_DIR: z.string().min(1).default("/data"),
    LOG_LEVEL: z.string().default("info"),
    WA_SESSION_MASTER_KEY: z.string().min(1),
    OAUTH_SIGNING_SECRET: z.string().min(32),
    WA_LINK_INVITE_SECRET: z.string().optional(),
    ALLOW_PUBLIC_SIGNUP: z.enum(["true", "false"]).default("false"),
    OAUTH_REDIRECT_HOSTS: z.string().default("chatgpt.com"),
  })
  .superRefine((value, ctx) => {
    if (value.ALLOW_PUBLIC_SIGNUP !== "true" && (!value.WA_LINK_INVITE_SECRET || value.WA_LINK_INVITE_SECRET.length < 16)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["WA_LINK_INVITE_SECRET"],
        message: "WA_LINK_INVITE_SECRET must be at least 16 chars unless ALLOW_PUBLIC_SIGNUP=true",
      });
    }
  });

const env = schema.parse(process.env);
const masterKey = Buffer.from(env.WA_SESSION_MASTER_KEY, "base64");
if (masterKey.byteLength !== 32) {
  throw new Error("WA_SESSION_MASTER_KEY must decode to exactly 32 bytes");
}

export const config = {
  port: env.PORT,
  origin: env.ORIGIN.replace(/\/$/, ""),
  dataDir: env.DATA_DIR,
  logLevel: env.LOG_LEVEL,
  masterKey,
  signingSecret: env.OAUTH_SIGNING_SECRET,
  inviteSecret: env.WA_LINK_INVITE_SECRET ?? "",
  publicSignup: env.ALLOW_PUBLIC_SIGNUP === "true",
  redirectHosts: new Set(
    env.OAUTH_REDIRECT_HOSTS.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  ),
};
