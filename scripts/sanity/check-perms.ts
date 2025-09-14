import '../env/load';
/* eslint-disable no-console */
import { assertWritePermissions } from '@/lib/sanity-clients';

async function main() {
  try {
    await assertWritePermissions();
    console.log('OK: Sanity write permissions verified');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
