#!/usr/bin/env tsx
/**
 * Environment Variables Validation Script
 *
 * This script validates environment variables before deployment
 * to ensure all required variables are present and properly configured.
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import {
  logEnvironmentValidation,
  requireValidEnvironment,
} from '../../lib/env-validation';

const args = process.argv.slice(2);
const shouldThrow = args.includes('--throw');
const shouldLog = args.includes('--log') || !shouldThrow;

function main() {
  if (shouldLog) {
    logEnvironmentValidation();
  }

  try {
    requireValidEnvironment();
    console.log('✅ Environment validation passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error instanceof Error ? error.message : String(error));

    if (shouldThrow) {
      process.exit(1);
    } else {
      console.log('💡 Run with --throw to exit on validation failure');
      process.exit(0);
    }
  }
}

main();
