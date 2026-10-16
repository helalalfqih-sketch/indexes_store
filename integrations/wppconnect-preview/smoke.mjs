import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { boundedJson } from './adapter.mjs';
const base = 'http://127.0.0.1:22465';
const report = { scope: 'ephemeral WPPConnect container, no WhatsApp login', checkedAt: new Date().toISOString(), checks: [], pairedAccount: false, sentMessages: 0 };
const check = (name, ok, detail) => { report.checks.push({ name, ok, detail }); if (!ok) throw new Error(name); };
try {
  let response;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { response = await fetch(base + '/api/manager/info', { signal: AbortSignal.timeout(2000) }); if (response.ok) break; await response.body?.cancel(); }
    catch { /* Bounded startup wait; never retries a write. */ }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  const info = response ? await boundedJson(response, 65536) : null;
  check('manager-protocol-1', info?.protocol === 1, { protocol: info?.protocol, version: info?.version });
  const ui = await fetch(base + '/manager/', { signal: AbortSignal.timeout(5000), redirect: 'error' });
  check('manager-ui-http-200', ui.status === 200, { status: ui.status });
  check('manager-ui-html', /text\/html/i.test(ui.headers.get('content-type') || ''), null);
  await ui.body?.cancel();
  const denied = await fetch(base + '/api/manager/sessions', { signal: AbortSignal.timeout(5000) });
  check('unauthenticated-session-list-rejected', [401, 403].includes(denied.status), { status: denied.status });
  await denied.body?.cancel();
  const secret = readFileSync(new URL('.env', import.meta.url), 'utf8').match(/^WPP_ADMIN_SECRET=(.+)$/m)?.[1];
  if (!secret) throw new Error('missing local preview secret');
  const listing = await boundedJson(await fetch(base + '/api/manager/sessions', { headers: { Authorization: 'Bearer ' + secret }, signal: AbortSignal.timeout(5000) }), 65536);
  check('fresh-isolated-storage-no-sessions', Array.isArray(listing.sessions) && listing.sessions.length === 0, { sessionCount: listing.sessions?.length });
} catch (error) {
  report.failure = error?.code || (report.checks.find(x => !x.ok)?.name ?? 'RUNTIME_SMOKE_UNAVAILABLE');
  process.exitCode = 1;
} finally {
  report.passed = !report.failure && report.checks.every(c => c.ok);
  mkdirSync(new URL('reports/', import.meta.url), { recursive: true });
  writeFileSync(new URL('reports/runtime-smoke.json', import.meta.url), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
