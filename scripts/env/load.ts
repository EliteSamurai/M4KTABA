import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';
let dotenvExpand: undefined | ((r: any) => any);
try {
  // optional: only used if present
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  dotenvExpand = require('dotenv-expand').expand;
} catch {
  // no-op; we'll continue without expansion
}

const root = process.cwd();

const candidates = ['.env.local', '.env.development.local', '.env'];

let loadedFile: string | null = null;
for (const file of candidates) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) {
    const result = dotenv.config({ path: full });
    if (dotenvExpand) {
      dotenvExpand(result as any);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        '[env] dotenv-expand not installed; skipping ${VAR} expansion'
      );
    }
    loadedFile = file;
    // eslint-disable-next-line no-console
    console.log(`[env] loaded ${file}`);
    break;
  }
}

if (!loadedFile) {
  // eslint-disable-next-line no-console
  console.warn(
    '[env] no .env file found in project root; relying on process env'
  );
}
