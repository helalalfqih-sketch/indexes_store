import { createDispatcher } from './mcp.mjs';
// Only newline-delimited JSON-RPC goes to stdout. No environment/payload logging.
const dispatch = createDispatcher();
const MAX_LINE = 64 * 1024; const MAX_QUEUE = 16;
let buffer = Buffer.alloc(0); let chain = Promise.resolve(); let pending = 0; let blocked = false;
const emit = value => { if (value !== null) process.stdout.write(JSON.stringify(value) + '\n'); };
function stop(code) { blocked = true; process.stderr.write(code + '\n'); process.exitCode = 1; process.stdin.destroy(); }
process.stdin.on('data', chunk => {
  if (blocked) return;
  buffer = Buffer.concat([buffer, chunk]);
  let end;
  while ((end = buffer.indexOf(10)) !== -1) {
    if (end > MAX_LINE) { stop('INPUT_TOO_LARGE'); return; }
    const line = buffer.subarray(0, end).toString('utf8'); buffer = buffer.subarray(end + 1);
    if (!line.trim()) continue;
    if (++pending > MAX_QUEUE) { stop('QUEUE_LIMIT'); return; }
    chain = chain.then(async () => {
      let request;
      try { request = JSON.parse(line); }
      catch { emit({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); return; }
      emit(await dispatch(request));
    }).catch(() => emit({ jsonrpc: '2.0', id: null, error: { code: -32603, message: 'Internal error' } })).finally(() => { pending--; });
  }
  if (buffer.length > MAX_LINE) stop('INPUT_TOO_LARGE');
});
process.stdin.on('end', () => {
  if (buffer.length && !blocked) process.stderr.write('INCOMPLETE_INPUT\n');
});
