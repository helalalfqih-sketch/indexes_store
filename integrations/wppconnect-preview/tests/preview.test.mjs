import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { WppPreview, SESSION, boundedJson } from '../adapter.mjs';
import { tools, invoke, createDispatcher } from '../mcp.mjs';
const CHAT = '1234567890@g.us';
const CHANNEL = '111122223333@newsletter';
const MID = 'false_1234567890@g.us_ABC';
const env = { INDEXES_ENV: 'preview', WPP_PREVIEW_ENABLED: 'true', WPP_SESSION: SESSION,
  WPP_SESSION_TOKEN: 'fixture-session-token-not-a-real-credential', WPP_EXPECTED_TEST_PHONE: '19995550123', WPP_APPROVED_CHAT_IDS: CHAT };
const message = { id: { _serialized: MID, remote: CHAT }, type: 'chat', body: 'synthetic test message', t: 123 };
const json = value => Response.json(value);
function harness(overrides = {}) {
  const calls = [];
  const transport = async (url, init) => {
    calls.push({ url, init });
    const path = new URL(url).pathname;
    if (Object.hasOwn(overrides, path)) return overrides[path]();
    if (path.endsWith('/verify')) return json({ authorized: true });
    if (path.endsWith('/get-phone-number')) return json({ status: 'success', response: env.WPP_EXPECTED_TEST_PHONE + '@c.us' });
    if (path.endsWith('/list-chats')) {
      const body = JSON.parse(init.body);
      return json([{ id: { _serialized: body.onlyNewsletter ? CHANNEL : CHAT }, name: 'Synthetic group', lastMessage: { body: 'must not leak' } }]);
    }
    if (path.includes('/get-messages/')) return json({ status: 'success', response: [message] });
    if (path.includes('/message-by-id/')) return json({ status: 'success', response: message });
    if (path.includes('/get-media-by-message/')) return json({ mimetype: 'image/png', base64: Buffer.from('synthetic-image').toString('base64') });
    throw Error('Unexpected request');
  };
  return { calls, transport, adapter: new WppPreview(env, transport) };
}
const rejects = (fn, code) => assert.rejects(fn, error => error.code === code);
for (const [name, patch, code] of [
  ['default off', { WPP_PREVIEW_ENABLED: '' }, 'PREVIEW_DISABLED'],
  ['production environment', { INDEXES_ENV: 'production' }, 'PREVIEW_DISABLED'],
  ['Vercel production override', { VERCEL_ENV: 'production' }, 'PREVIEW_DISABLED'],
  ['wrong session', { WPP_SESSION: 'main' }, 'SESSION_NOT_APPROVED'],
  ['external origin', { WPP_ORIGIN: 'https://example.com' }, 'ORIGIN_NOT_APPROVED'],
  ['local different port', { WPP_ORIGIN: 'http://127.0.0.1:80' }, 'ORIGIN_NOT_APPROVED'],
  ['missing token', { WPP_SESSION_TOKEN: '' }, 'SESSION_TOKEN_REQUIRED'],
  ['missing phone', { WPP_EXPECTED_TEST_PHONE: '' }, 'TEST_PHONE_REQUIRED'],
  ...['967771370740', '967772565855', '17115864259'].map(phone => ['known production phone ' + phone, { WPP_EXPECTED_TEST_PHONE: phone }, 'PRODUCTION_PHONE_BLOCKED']),
]) {
  test('blocks ' + name + ' before any network', async () => {
    let calls = 0;
    const adapter = new WppPreview({ ...env, ...patch }, async () => { calls++; throw Error('network'); });
    await rejects(() => adapter.verify(), code); assert.equal(calls, 0);
  });
}
test('identity checks exact session with body, then exact phone; no admin key in URL', async () => {
  const h = harness(); const out = await h.adapter.verify();
  assert.equal(out.testPhoneIdentityVerified, true);
  assert.equal(out.liveMessageDeliveryVerified, false);
  assert.equal(h.calls.length, 2); assert.equal(h.calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(h.calls[0].init.body), { session: SESSION });
  assert(!JSON.stringify(out).includes(env.WPP_SESSION_TOKEN));
  assert(h.calls.every(c => !c.url.includes(env.WPP_SESSION_TOKEN) && c.init.redirect === 'error'));
});
test('mismatched phone blocks subsequent content reads', async () => {
  const h = harness({ ['/api/' + SESSION + '/get-phone-number']: () => json({ response: '967771370740@c.us' }) });
  await rejects(() => h.adapter.chats({}), 'PHONE_MISMATCH'); assert.equal(h.calls.length, 2);
});
test('unauthenticated session blocks phone/content reads', async () => {
  const h = harness({ '/api/manager/verify': () => json({ authorized: false }) });
  await rejects(() => h.adapter.verify(), 'SESSION_AUTH_UNCONFIRMED'); assert.equal(h.calls.length, 1);
});
for (const kind of ['all', 'group', 'channel']) test('sanitizes ' + kind + ' metadata with provider filters', async () => {
  const h = harness(); const out = await h.adapter.chats({ kind, limit: 3 });
  assert.equal(out.returned, 1); assert(!JSON.stringify(out).includes('must not leak'));
  const body = JSON.parse(h.calls.at(-1).init.body);
  assert.equal(body.count, 3); assert.equal(body.ignoreGroupMetadata, true);
  if (kind === 'group') assert.equal(body.onlyGroups, true);
  if (kind === 'channel') assert.equal(body.onlyNewsletter, true);
});
test('rejects upstream group filter violations, not silent false matches', async () => {
  const h = harness({ ['/api/' + SESSION + '/list-chats']: () => json([{ id: '19995550123@c.us' }]) });
  await rejects(() => h.adapter.chats({ kind: 'group' }), 'PROVIDER_FILTER_MISMATCH');
});
test('rejects arbitrary URL, extra params, noninteger and excessive limits', async () => {
  const h = harness();
  for (const args of [{ url: 'https://example.com' }, { limit: 21 }, { limit: 1.5 }, { kind: 'send' }, { after: '../../etc' }]) await assert.rejects(() => h.adapter.chats(args));
  assert.equal(h.calls.length, 0);
});
test('message reads require exact approved chat', async () => {
  const h = harness(); await rejects(() => h.adapter.messages({ chatId: CHANNEL }), 'CHAT_NOT_APPROVED'); assert.equal(h.calls.length, 0);
  const out = await h.adapter.messages({ chatId: CHAT, limit: 4 });
  assert.equal(out.messages[0].text, 'synthetic test message');
  assert(h.calls.at(-1).url.includes('count=4')); assert.equal(h.calls.at(-1).init.method, 'GET');
});
test('mismatched message chat is rejected', async () => {
  const h = harness({ ['/api/' + SESSION + '/get-messages/' + encodeURIComponent(CHAT)]: () => json([{ ...message, id: { _serialized: MID, remote: CHANNEL } }]) });
  await rejects(() => h.adapter.messages({ chatId: CHAT }), 'MESSAGE_CHAT_MISMATCH');
});
test('image retrieval verifies ownership, bounds bytes and hashes the original result', async () => {
  const h = harness(); const out = await h.adapter.media({ chatId: CHAT, messageId: MID });
  assert.equal(out.resource.type, 'image'); assert.equal(out.metadata.size, 15); assert.match(out.metadata.sha256, /^[a-f0-9]{64}$/);
  assert(h.calls.at(-2).url.includes('/message-by-id/'));
});
test('video retrieval returns embedded resource, not an invented public URL', async () => {
  const h = harness({ ['/api/' + SESSION + '/get-media-by-message/' + encodeURIComponent(MID)]: () => json({ base64: Buffer.from('synthetic-video').toString('base64'), mimetype: 'video/mp4' }) });
  const out = await h.adapter.media({ chatId: CHAT, messageId: MID });
  assert.equal(out.resource.type, 'resource'); assert.equal(out.resource.resource.mimeType, 'video/mp4');
  assert(out.resource.resource.uri.startsWith('wpp-preview://'));
});
test('refuses media outside the verified chat before download', async () => {
  const h = harness({ ['/api/' + SESSION + '/message-by-id/' + encodeURIComponent(MID)]: () => json({ ...message, id: { _serialized: MID, remote: CHANNEL } }) });
  await rejects(() => h.adapter.media({ chatId: CHAT, messageId: MID }), 'MESSAGE_CHAT_MISMATCH');
  assert(!h.calls.some(c => c.url.includes('/get-media-by-message/')));
});
test('unsupported active media and invalid base64 are rejected', async () => {
  for (const body of [{ mimetype: 'image/svg+xml', base64: 'dGVzdA==' }, { mimetype: 'image/png', base64: 'not_base64' }]) {
    const h = harness({ ['/api/' + SESSION + '/get-media-by-message/' + encodeURIComponent(MID)]: () => json(body) });
    await assert.rejects(() => h.adapter.media({ chatId: CHAT, messageId: MID }));
  }
});
test('provider errors never leak raw server/token details', async () => {
  const h = harness({ '/api/manager/verify': () => new Response(env.WPP_SESSION_TOKEN, { status: 500 }) });
  const out = await invoke('wpp_preview_identity', {}, h.adapter);
  assert.equal(out.isError, true); assert(!JSON.stringify(out).includes(env.WPP_SESSION_TOKEN));
});
test('bounded streamed JSON cancels oversized responses', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(c) { c.enqueue(Buffer.alloc(200)); }, cancel() { cancelled = true; } });
  await rejects(() => boundedJson(new Response(stream, { headers: { 'Content-Type': 'application/json' } }), 100), 'RESPONSE_TOO_LARGE');
  assert(cancelled);
});
test('all MCP tools are read-only; write names cannot execute', async () => {
  assert.equal(tools.length, 5); assert(tools.every(t => t.annotations.readOnlyHint === true));
  const h = harness(); assert.equal((await invoke('send_message', {}, h.adapter)).structuredContent.error, 'UNKNOWN_TOOL'); assert.equal(h.calls.length, 0);
});
test('MCP initializes, returns tools, preserves IDs, and requires initialization', async () => {
  const rpc = createDispatcher(harness().adapter);
  assert.equal((await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' })).error.code, -32000);
  assert.equal((await rpc({ jsonrpc: '2.0', id: 'i', method: 'initialize', params: { protocolVersion: '2025-06-18' } })).result.protocolVersion, '2025-06-18');
  assert.equal((await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).result.tools.length, 5);
  assert.equal(await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  assert.equal((await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'wpp_preview_capabilities' } })).result.structuredContent.writesExposed, false);
});
test('real local HTTP + subprocess stdio integration (synthetic provider, no WhatsApp account)', { timeout: 10000 }, async () => {
  const h = harness();
  const server = createServer(async (request, response) => {
    const chunks = []; for await (const c of request) chunks.push(c);
    const upstream = await h.transport('http://127.0.0.1:22465' + request.url, { method: request.method, headers: request.headers, body: Buffer.concat(chunks).toString() || undefined });
    response.writeHead(upstream.status, Object.fromEntries(upstream.headers)); response.end(await upstream.text());
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(22465, '127.0.0.1', resolve); });
  try {
    const child = spawn(process.execPath, [new URL('../stdio.mjs', import.meta.url).pathname], { env: { ...process.env, ...env } });
    let stdout = '', stderr = ''; child.stdout.on('data', d => { stdout += d; }); child.stderr.on('data', d => { stderr += d; });
    const calls = [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'wpp_preview_chats', arguments: { kind: 'channel', limit: 2 } } },
    ];
    child.stdin.end(calls.map(x => JSON.stringify(x)).join('\n') + '\n');
    const code = await new Promise(resolve => child.once('close', resolve));
    assert.equal(code, 0, stderr); const output = stdout.trim().split('\n').map(JSON.parse);
    assert.equal(output.length, 3); assert.equal(output[1].result.tools.length, 5);
    assert.equal(output[2].result.structuredContent.chats[0].id, CHANNEL);
    assert(!stdout.includes(env.WPP_SESSION_TOKEN));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
