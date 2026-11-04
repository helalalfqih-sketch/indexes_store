import { PreviewError, WppPreview, strictArgs } from './adapter.mjs';

const empty = { type: 'object', properties: {}, additionalProperties: false };
const limit = { type: 'integer', minimum: 1, maximum: 20, default: 10 };
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true };
export const tools = [
  { name: 'wpp_preview_capabilities', description: 'Implementation/limitations only; does not claim a live connection.', inputSchema: empty },
  { name: 'wpp_preview_identity', description: 'Verify a token belongs to the exact isolated session and approved test phone.', inputSchema: empty },
  { name: 'wpp_preview_chats', description: 'Bounded metadata for the test account: chats, groups or channels. Does not load message contents.', inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['all', 'group', 'channel'] }, limit, after: { type: 'string' } }, additionalProperties: false } },
  { name: 'wpp_preview_messages', description: 'Read messages only in an exact server-allowlisted test chat. No mark-as-read operation.', inputSchema: { type: 'object', properties: { chatId: { type: 'string' }, limit, before: { type: 'string' } }, required: ['chatId'], additionalProperties: false } },
  { name: 'wpp_preview_media', description: 'Read media up to 4 MiB from a message proven to belong to an approved test chat. Returns image or embedded resource.', inputSchema: { type: 'object', properties: { chatId: { type: 'string' }, messageId: { type: 'string' } }, required: ['chatId', 'messageId'], additionalProperties: false } },
].map(t => ({ ...t, title: t.name.replaceAll('_', ' '), annotations: readOnly }));
const textResult = data => ({ content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data });
export async function invoke(name, args, adapter) {
  try {
    if (name === 'wpp_preview_capabilities') { strictArgs(args, []); return textResult(adapter.capabilities()); }
    if (name === 'wpp_preview_identity') { strictArgs(args, []); return textResult(await adapter.verify()); }
    if (name === 'wpp_preview_chats') return textResult(await adapter.chats(args));
    if (name === 'wpp_preview_messages') return textResult(await adapter.messages(args));
    if (name === 'wpp_preview_media') {
      const { metadata, resource } = await adapter.media(args);
      return { ...textResult(metadata), content: [resource, ...textResult(metadata).content] };
    }
    throw new PreviewError('UNKNOWN_TOOL');
  } catch (error) {
    const code = error instanceof PreviewError ? error.code : 'READ_FAILED';
    return { isError: true, ...textResult({ error: code }) };
  }
}

/** Small stateless MCP stdio surface. Deliberately NO HTTP listener or OAuth claim.
 * The embedding Indexes MCP may reuse invoke/tools after its own OAuth authorization.
 * No dependencies and no production handler imports, so local security tests run offline.
 */
export function createDispatcher(adapter = new WppPreview()) {
  let initialized = false;
  return async request => {
    if (!request || typeof request !== 'object' || Array.isArray(request) || request.jsonrpc !== '2.0' || typeof request.method !== 'string')
      return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid request' } };
    const hasId = Object.hasOwn(request, 'id');
    if (!hasId) return null;
    if (typeof request.id !== 'string' && (typeof request.id !== 'number' || !Number.isSafeInteger(request.id)))
      return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid request id' } };
    const base = { jsonrpc: '2.0', id: request.id };
    if (request.method === 'initialize') {
      initialized = true;
      const versions = ['2024-11-05', '2025-03-26', '2025-06-18'];
      const v = request.params?.protocolVersion;
      return { ...base, result: { protocolVersion: versions.includes(v) ? v : '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'indexes-whatsapp-wppconnect-preview', version: '0.1.0' }, instructions: 'Test-account reads only. No sends, QR, group changes or production access.' } };
    }
    if (request.method === 'ping') return { ...base, result: {} };
    if (!initialized) return { ...base, error: { code: -32000, message: 'Initialize first' } };
    if (request.method === 'tools/list') return { ...base, result: { tools } };
    if (request.method === 'tools/call') {
      if (typeof request.params?.name !== 'string') return { ...base, error: { code: -32602, message: 'Missing tool name' } };
      return { ...base, result: await invoke(request.params.name, request.params.arguments ?? {}, adapter) };
    }
    return { ...base, error: { code: -32601, message: 'Method not found' } };
  };
}
