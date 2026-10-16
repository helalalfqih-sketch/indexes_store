import { createHash } from 'node:crypto';

export const SOURCE_COMMIT = 'a6a6a8449d544d7dfbdc6570dc3b4208d3c9703d';
export const SESSION = 'indexes_wa_test_20261016';
const PRODUCTION_PHONES = new Set(['967771370740', '967772565855', '17115864259']);
const CHAT = /^[0-9][0-9-]{4,45}@(c\.us|g\.us|newsletter|lid)$/;
const MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg', 'application/pdf']);
export class PreviewError extends Error {
  constructor(code) { super(code); this.code = code; this.name = 'PreviewError'; }
}
const fail = code => { throw new PreviewError(code); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const identifier = value => typeof value === 'string' ? value : object(value) ? value._serialized : undefined;
const clean = (value, max = 160) => typeof value === 'string' ? value.slice(0, max) : null;
function unwrap(raw) {
  if (object(raw) && typeof raw.status === 'string' && /^(error|failed)$/i.test(raw.status)) fail('PROVIDER_REJECTED');
  return object(raw) && Object.hasOwn(raw, 'response') ? raw.response : raw;
}
export function strictArgs(args, allowed) {
  if (!object(args) || Object.keys(args).some(key => !allowed.includes(key))) fail('INVALID_ARGUMENTS');
}
function count(value = 10) {
  if (!Number.isInteger(value) || value < 1 || value > 20) fail('INVALID_LIMIT');
  return value;
}
function chatId(value) {
  if (typeof value !== 'string' || !CHAT.test(value)) fail('INVALID_CHAT_ID');
  return value;
}
function messageId(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 512 || /[\x00-\x20/\\?#]/.test(value)) fail('INVALID_MESSAGE_ID');
  return value;
}
export async function boundedJson(response, maximum) {
  if (!response.ok) {
    await response.body?.cancel();
    fail(response.status === 401 || response.status === 403 ? 'PROVIDER_AUTH_FAILED' : 'PROVIDER_HTTP_ERROR');
  }
  if (!/application\/json/i.test(response.headers.get('content-type') || '')) {
    await response.body?.cancel(); fail('PROVIDER_NOT_JSON');
  }
  if (Number(response.headers.get('content-length') || 0) > maximum) {
    await response.body?.cancel(); fail('RESPONSE_TOO_LARGE');
  }
  const reader = response.body?.getReader();
  if (!reader) fail('EMPTY_RESPONSE');
  const chunks = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) { await reader.cancel(); fail('RESPONSE_TOO_LARGE'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { fail('INVALID_PROVIDER_JSON'); }
}
export class WppPreview {
  #env; #fetch;
  constructor(env = process.env, transport = fetch) { this.#env = { ...env }; this.#fetch = transport; }
  capabilities() {
    return {
      provider: 'WPPConnect Server', stage: 'isolated-preview', session: SESSION,
      productionIntegrationChanged: false, writesExposed: false,
      implemented: ['identity-check', 'bounded-chat/group/channel-list', 'approved-chat-messages', 'approved-message-media'],
      liveAccountTested: false,
      limitations: ['No send, delete, join, publish, QR, or session-control tools.',
        'No promise of all historical messages/media.', 'Not the official Meta WhatsApp Cloud API.',
        'Local stdio transport only; remote ChatGPT OAuth publication is not implemented.'],
      sourceCommit: SOURCE_COMMIT,
    };
  }
  #config() {
    const e = this.#env;
    if (e.INDEXES_ENV !== 'preview' || e.WPP_PREVIEW_ENABLED !== 'true' || e.VERCEL_ENV === 'production') fail('PREVIEW_DISABLED');
    if (e.WPP_SESSION !== SESSION) fail('SESSION_NOT_APPROVED');
    const origin = e.WPP_ORIGIN || 'http://127.0.0.1:22465';
    // Only this local, isolated server is accepted. No arbitrary remote URLs or DNS.
    if (origin !== 'http://127.0.0.1:22465') fail('ORIGIN_NOT_APPROVED');
    const token = e.WPP_SESSION_TOKEN || '';
    if (token.length < 20 || token.length > 1024 || /\s/.test(token)) fail('SESSION_TOKEN_REQUIRED');
    const phone = e.WPP_EXPECTED_TEST_PHONE || '';
    if (!/^[1-9][0-9]{8,14}$/.test(phone)) fail('TEST_PHONE_REQUIRED');
    if (PRODUCTION_PHONES.has(phone)) fail('PRODUCTION_PHONE_BLOCKED');
    return { origin, token, phone };
  }
  async #request(route, body, maximum = 1024 * 1024) {
    const c = this.#config();
    // Callers are private methods with fixed routes; MCP callers never supply a URL.
    const timeout = AbortSignal.timeout(12000);
    try {
      const response = await this.#fetch(c.origin + route, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error', cache: 'no-store', signal: timeout,
      });
      return await boundedJson(response, maximum);
    } catch (error) {
      if (error instanceof PreviewError) throw error;
      fail('PROVIDER_UNAVAILABLE'); // No raw URL, token, body or provider error is leaked.
    }
  }
  async verify() {
    const c = this.#config();
    const auth = await this.#request('/api/manager/verify', { session: SESSION }, 65536);
    if (auth?.authorized !== true) fail('SESSION_AUTH_UNCONFIRMED');
    const raw = unwrap(await this.#request('/api/' + SESSION + '/get-phone-number', undefined, 65536));
    const wid = identifier(raw);
    if (typeof wid !== 'string' || !/^\d+@c\.us$/.test(wid)) fail('PHONE_IDENTITY_UNCONFIRMED');
    if (wid !== c.phone + '@c.us') fail('PHONE_MISMATCH');
    return { providerApiReachable: true, testPhoneIdentityVerified: true, phoneSuffix: c.phone.slice(-4), liveMessageDeliveryVerified: false };
  }
  #approved(chat) {
    chatId(chat);
    const allowed = (this.#env.WPP_APPROVED_CHAT_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
    if (!allowed.includes(chat)) fail('CHAT_NOT_APPROVED');
  }
  async chats(args = {}) {
    strictArgs(args, ['kind', 'limit', 'after']);
    const limit = count(args.limit); const kind = args.kind || 'all';
    if (!['all', 'group', 'channel'].includes(kind)) fail('INVALID_CHAT_KIND');
    if (args.after !== undefined) chatId(args.after);
    await this.verify();
    const payload = { count: limit, direction: 'after', ignoreGroupMetadata: true,
      ...(args.after ? { id: args.after } : {}),
      ...(kind === 'group' ? { onlyGroups: true } : {}),
      ...(kind === 'channel' ? { onlyNewsletter: true } : {}),
    };
    const raw = unwrap(await this.#request('/api/' + SESSION + '/list-chats', payload));
    if (!Array.isArray(raw)) fail('UNRECOGNIZED_CHAT_SCHEMA');
    const rows = raw.slice(0, limit).map(value => {
      const id = chatId(identifier(value?.id));
      if (kind === 'group' && !id.endsWith('@g.us')) fail('PROVIDER_FILTER_MISMATCH');
      if (kind === 'channel' && !id.endsWith('@newsletter')) fail('PROVIDER_FILTER_MISMATCH');
      return { id, name: clean(value.name ?? value.formattedTitle),
        kind: id.endsWith('@g.us') ? 'group' : id.endsWith('@newsletter') ? 'channel' : 'chat' };
    });
    return { chats: rows, returned: rows.length, nextAfter: rows.length === limit ? rows.at(-1).id : null,
      paginationHint: 'nextAfter is a candidate, not proof that more records exist', upstreamExceedsLimit: raw.length > limit };
  }
  #message(raw, chat) {
    const row = unwrap(raw);
    if (!object(row)) fail('UNRECOGNIZED_MESSAGE_SCHEMA');
    const id = messageId(identifier(row.id));
    const remote = identifier(row.chatId) ?? identifier(row.id?.remote) ??
      (row.fromMe === true ? identifier(row.to) : row.fromMe === false ? identifier(row.from) : undefined);
    if (remote !== chat) fail('MESSAGE_CHAT_MISMATCH');
    return { id, chatId: remote, type: clean(row.type, 40),
      text: row.type === 'chat' ? clean(row.body, 4000) : null,
      caption: clean(row.caption, 1024), mimeType: clean(row.mimetype, 100),
      timestamp: typeof row.timestamp === 'number' ? row.timestamp : typeof row.t === 'number' ? row.t : null };
  }
  async messages(args) {
    strictArgs(args, ['chatId', 'limit', 'before']);
    this.#approved(args.chatId); const limit = count(args.limit);
    if (args.before !== undefined) messageId(args.before);
    await this.verify();
    const query = new URLSearchParams({ count: String(limit), direction: 'before', ...(args.before ? { id: args.before } : {}) });
    const raw = unwrap(await this.#request('/api/' + SESSION + '/get-messages/' + encodeURIComponent(args.chatId) + '?' + query));
    if (!Array.isArray(raw)) fail('UNRECOGNIZED_MESSAGE_SCHEMA');
    const messages = raw.slice(0, limit).map(row => this.#message(row, args.chatId));
    return { chatId: args.chatId, messages, returned: messages.length, upstreamExceedsLimit: raw.length > limit };
  }
  async media(args) {
    strictArgs(args, ['chatId', 'messageId']);
    this.#approved(args.chatId); messageId(args.messageId);
    await this.verify();
    const checked = this.#message(await this.#request('/api/' + SESSION + '/message-by-id/' + encodeURIComponent(args.messageId)), args.chatId);
    if (checked.id !== args.messageId) fail('MESSAGE_ID_MISMATCH');
    const media = await this.#request('/api/' + SESSION + '/get-media-by-message/' + encodeURIComponent(args.messageId), undefined, 6 * 1024 * 1024);
    if (!MIME.has(media?.mimetype) || typeof media?.base64 !== 'string') fail('UNSUPPORTED_MEDIA');
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(media.base64)) fail('INVALID_MEDIA_ENCODING');
    const bytes = Buffer.from(media.base64, 'base64');
    if (!bytes.length || bytes.length > 4 * 1024 * 1024) fail('MEDIA_SIZE_LIMIT');
    if (bytes.toString('base64') !== media.base64) fail('INVALID_MEDIA_ENCODING');
    const metadata = { chatId: args.chatId, messageId: args.messageId, mimeType: media.mimetype,
      size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
    const resource = media.mimetype.startsWith('image/')
      ? { type: 'image', data: media.base64, mimeType: media.mimetype }
      : { type: 'resource', resource: { uri: 'wpp-preview://media/' + encodeURIComponent(args.messageId), mimeType: media.mimetype, blob: media.base64 } };
    return { metadata, resource };
  }
}
