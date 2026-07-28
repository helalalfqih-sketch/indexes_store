import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const serverOnlyModules = [
  'node:fs',
  'node:path',
  'node:child_process',
  'node:os',
  'node:crypto',
  'fs/promises',
  'path',
  '@/services/ai-agent/',
];

const checkDirs = ['src/components', 'src/routes', 'src/features'];

async function scanDir(dir) {
  const files = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Exclude API routes
        if (entry.name === 'api' && fullPath.includes('src\\routes\\api')) continue;
        if (entry.name === 'api' && fullPath.includes('src/routes/api')) continue;
        files.push(...(await scanDir(fullPath)));
      } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.server.ts') && !entry.name.endsWith('.functions.ts')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err);
  }
  return files;
}

async function run() {
  let hasViolation = false;
  console.log('Running Client/Server Boundary Check...');

  for (const checkDir of checkDirs) {
    const fullCheckDir = path.join(PROJECT_ROOT, checkDir);
    const files = await scanDir(fullCheckDir);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Look for standard imports
      for (const mod of serverOnlyModules) {
        // Simple heuristic: look for import statements containing the module name
        // (This does not cover dynamic imports perfectly, but works for direct imports)
        if (content.includes(`from "${mod}`) || content.includes(`from '${mod}`) || content.includes(`require("${mod}")`) || content.includes(`require('${mod}')`)) {
          // Special exception: Types only imports are fine
          const isTypeImport = new RegExp(`import\\s+type\\s+.*(?:from\\s+['"]${mod}|['"]${mod}['"])`, 's').test(content);
          
          if (!isTypeImport) {
             console.error(`❌ VIOLATION: File ${path.relative(PROJECT_ROOT, file)} imports server-only module: ${mod}`);
             hasViolation = true;
          }
        }
      }
    }
  }

  // Explicit check for VisualArchitectureMap regression
  const archMapFile = path.join(PROJECT_ROOT, 'src/components/ai-agent/visual-architecture-map.tsx');
  try {
    const content = await fs.readFile(archMapFile, 'utf-8');
    if (content.includes('auditProjectArchitecture') && !content.includes('import type')) {
       console.error(`❌ REGRESSION: VisualArchitectureMap directly imports architecture.service.ts!`);
       hasViolation = true;
    }
  } catch (err) {
    console.error('Could not check VisualArchitectureMap:', err);
  }

  if (hasViolation) {
    console.error('Boundary check failed. Client components must not import server-only modules.');
    process.exit(1);
  } else {
    console.log('✅ Boundary check passed. No violations found.');
  }
}

run();
