import { randomUUID } from "node:crypto";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  getContentType,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { config } from "./config.js";
import { useEncryptedAuthState } from "./auth-state.js";

export type SessionStatus = "starting" | "qr" | "open" | "reconnecting" | "logged_out" | "error";

export interface MessageSummary {
  id: string | null;
  chatId: string;
  fromMe: boolean;
  timestamp: number | null;
  type: string | null;
  text: string | null;
}

interface ChatSummary {
  id: string;
  name: string | null;
  unreadCount: number | null;
  lastMessageAt: number | null;
}

interface SessionRecord {
  id: string;
  status: SessionStatus;
  socket?: WASocket;
  qr?: string;
  phone?: string;
  lastError?: string;
  chats: Map<string, ChatSummary>;
  messages: Map<string, MessageSummary[]>;
}

const logger = pino({ level: config.logLevel });

function textFromMessage(message: WAMessage): string | null {
  const body = message.message;
  if (!body) return null;
  return (
    body.conversation ??
    body.extendedTextMessage?.text ??
    body.imageMessage?.caption ??
    body.videoMessage?.caption ??
    body.documentMessage?.caption ??
    null
  );
}

export class SessionManager {
  private readonly sessions = new Map<string, SessionRecord>();

  createSessionId(): string {
    return randomUUID();
  }

  private getOrCreate(sessionId: string): SessionRecord {
    let record = this.sessions.get(sessionId);
    if (!record) {
      record = {
        id: sessionId,
        status: "starting",
        chats: new Map(),
        messages: new Map(),
      };
      this.sessions.set(sessionId, record);
    }
    return record;
  }

  async start(sessionId: string): Promise<SessionRecord> {
    const record = this.getOrCreate(sessionId);
    if (record.socket && ["starting", "qr", "open", "reconnecting"].includes(record.status)) {
      return record;
    }

    record.status = "starting";
    record.lastError = undefined;
    const { state, saveCreds } = await useEncryptedAuthState(sessionId);
    const socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu("Indexes WhatsApp MCP"),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      logger,
    });
    record.socket = socket;

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("chats.upsert", (chats) => {
      for (const chat of chats) {
        if (!chat.id) continue;
        record.chats.set(chat.id, {
          id: chat.id,
          name: chat.name ?? null,
          unreadCount: typeof chat.unreadCount === "number" ? chat.unreadCount : null,
          lastMessageAt: typeof chat.conversationTimestamp === "number" ? chat.conversationTimestamp : null,
        });
      }
    });

    socket.ev.on("chats.update", (updates) => {
      for (const update of updates) {
        if (!update.id) continue;
        const current = record.chats.get(update.id);
        record.chats.set(update.id, {
          id: update.id,
          name: update.name ?? current?.name ?? null,
          unreadCount: typeof update.unreadCount === "number" ? update.unreadCount : current?.unreadCount ?? null,
          lastMessageAt:
            typeof update.conversationTimestamp === "number"
              ? update.conversationTimestamp
              : current?.lastMessageAt ?? null,
        });
      }
    });

    socket.ev.on("messages.upsert", ({ messages }) => {
      for (const message of messages) {
        const chatId = message.key.remoteJid;
        if (!chatId) continue;
        const timestamp =
          typeof message.messageTimestamp === "number"
            ? message.messageTimestamp
            : message.messageTimestamp
              ? Number(message.messageTimestamp)
              : null;
        const summary: MessageSummary = {
          id: message.key.id ?? null,
          chatId,
          fromMe: message.key.fromMe === true,
          timestamp: Number.isFinite(timestamp) ? timestamp : null,
          type: message.message ? getContentType(message.message) ?? null : null,
          text: textFromMessage(message),
        };
        const existing = record.messages.get(chatId) ?? [];
        existing.push(summary);
        if (existing.length > 500) existing.splice(0, existing.length - 500);
        record.messages.set(chatId, existing);
        const chat = record.chats.get(chatId);
        record.chats.set(chatId, {
          id: chatId,
          name: chat?.name ?? null,
          unreadCount: chat?.unreadCount ?? null,
          lastMessageAt: summary.timestamp ?? chat?.lastMessageAt ?? null,
        });
      }
    });

    socket.ev.on("connection.update", (update) => {
      if (record.socket !== socket) return;
      if (update.qr) {
        record.qr = update.qr;
        record.status = "qr";
      }
      if (update.connection === "open") {
        record.qr = undefined;
        record.phone = socket.user?.id ?? undefined;
        record.status = "open";
      }
      if (update.connection === "close") {
        record.socket = undefined;
        const statusCode = (update.lastDisconnect?.error as any)?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut) {
          record.status = "logged_out";
          record.qr = undefined;
          return;
        }
        record.status = "reconnecting";
        setTimeout(() => {
          void this.start(sessionId).catch((error) => {
            record.status = "error";
            record.lastError = error instanceof Error ? error.message : "RECONNECT_FAILED";
          });
        }, 1500);
      }
    });

    return record;
  }

  status(sessionId: string) {
    const record = this.getOrCreate(sessionId);
    return {
      sessionId,
      status: record.status,
      phone: record.phone ?? null,
      hasQr: Boolean(record.qr),
      lastError: record.lastError ?? null,
    };
  }

  async qrDataUrl(sessionId: string): Promise<string | null> {
    const record = this.getOrCreate(sessionId);
    if (!record.qr) return null;
    return QRCode.toDataURL(record.qr, { width: 360, margin: 2, errorCorrectionLevel: "M" });
  }

  listChats(sessionId: string, limit = 50): ChatSummary[] {
    const record = this.getOrCreate(sessionId);
    return [...record.chats.values()]
      .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0))
      .slice(0, Math.max(1, Math.min(limit, 100)));
  }

  readMessages(sessionId: string, chatId: string, limit = 50): MessageSummary[] {
    const record = this.getOrCreate(sessionId);
    return (record.messages.get(chatId) ?? []).slice(-Math.max(1, Math.min(limit, 100)));
  }

  async sendText(sessionId: string, chatId: string, text: string) {
    if (!/^[0-9A-Za-z_.:-]+@(s\.whatsapp\.net|g\.us|newsletter|lid|c\.us)$/.test(chatId)) {
      throw new Error("INVALID_WHATSAPP_DESTINATION");
    }
    const body = text.trim();
    if (!body || body.length > 4000) throw new Error("INVALID_MESSAGE_BODY");
    const record = this.getOrCreate(sessionId);
    if (!record.socket || record.status !== "open") {
      await this.start(sessionId);
    }
    if (!record.socket || record.status !== "open") throw new Error("WHATSAPP_NOT_CONNECTED");
    const result = await record.socket.sendMessage(chatId, { text: body });
    return {
      sent: true,
      messageId: result?.key?.id ?? null,
      chatId: result?.key?.remoteJid ?? chatId,
    };
  }
}

export const sessions = new SessionManager();
