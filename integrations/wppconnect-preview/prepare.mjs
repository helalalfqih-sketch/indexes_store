import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
// Refuse overwrite: never rotate or replace any existing test/production secret.
const secret = randomBytes(48).toString('hex');
writeFileSync(new URL('.env', import.meta.url), 'WPP_ADMIN_SECRET=' + secret + '\n', { mode: 0o600, flag: 'wx' });
mkdirSync(new URL('reports/', import.meta.url), { recursive: true });
process.stdout.write('Created a local preview-only .env (0600); secret is not printed. No sessions were started.\n');
