#!/usr/bin/env tsx

/**
 * Production Environment Validation Script
 * Validates that all required environment variables are set for production deployment
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

interface ValidationResult {
  platform: string;
  isValid: boolean;
  missing: string[];
  warnings: string[];
  critical: string[];
}

const PLATFORMS = {
  vercel: {
    name: 'Vercel (Web App)',
    required: [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'GOOGLE_ID',
      'GOOGLE_SECRET',
      'SANITY_PROJECT_ID',
      'SANITY_DATASET',
      'SANITY_API_TOKEN',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_BASE_URL',
      'NODE_ENV',
    ],
    critical: [
      'NEXTAUTH_SECRET',
      'SANITY_PROJECT_ID',
      'SANITY_DATASET',
      'STRIPE_SECRET_KEY',
    ],
  },
};

function validatePlatform(
  platformKey: keyof typeof PLATFORMS
): ValidationResult {
  const platform = PLATFORMS[platformKey];
  const result: ValidationResult = {
    platform: platform.name,
    isValid: true,
    missing: [],
    warnings: [],
    critical: [],
  };

  // Check required variables
  for (const varName of platform.required) {
    if (!process.env[varName]) {
      result.missing.push(varName);
      result.isValid = false;
    }
  }

  // Check critical variables
  for (const varName of platform.critical) {
    if (!process.env[varName]) {
      result.critical.push(varName);
      result.isValid = false;
    }
  }

  // Add warnings for common issues
  if (process.env.NODE_ENV !== 'production') {
    result.warnings.push(
      'NODE_ENV should be "production" for production deployment'
    );
  }

  if (
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')
  ) {
    result.warnings.push(
      'STRIPE_SECRET_KEY should be a live key (sk_live_) for production'
    );
  }

  if (
    process.env.NEXTAUTH_URL &&
    !process.env.NEXTAUTH_URL.startsWith('https://')
  ) {
    result.warnings.push('NEXTAUTH_URL should use HTTPS for production');
  }

  return result;
}

function printValidationResult(result: ValidationResult): void {
  console.log(`\n🔍 ${result.platform} Validation`);
  console.log('='.repeat(50));

  if (result.isValid) {
    console.log('✅ All required variables are set');
  } else {
    console.log('❌ Missing required variables:');
    result.missing.forEach(varName => {
      const isCritical = result.critical.includes(varName);
      console.log(`   ${isCritical ? '🚨' : '⚠️'} ${varName}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }

  if (result.critical.length > 0) {
    console.log('\n🚨 Critical Issues:');
    result.critical.forEach(varName => {
      console.log(`   • ${varName} is required for production`);
    });
  }
}

function main(): void {
  console.log('🚀 Production Environment Validation');
  console.log('=====================================');

  const args = process.argv.slice(2);
  const platform = args[0] as keyof typeof PLATFORMS;

  if (platform && platform in PLATFORMS) {
    // Validate specific platform
    const result = validatePlatform(platform);
    printValidationResult(result);

    if (!result.isValid) {
      process.exit(1);
    }
  } else {
    // Validate all platforms
    let allValid = true;

    for (const platformKey of Object.keys(PLATFORMS) as Array<
      keyof typeof PLATFORMS
    >) {
      const result = validatePlatform(platformKey);
      printValidationResult(result);

      if (!result.isValid) {
        allValid = false;
      }
    }

    console.log('\n📊 Summary');
    console.log('==========');

    if (allValid) {
      console.log('✅ All platforms are ready for production deployment');
    } else {
      console.log('❌ Some platforms have missing configuration');
      console.log('\n💡 Next steps:');
      console.log(
        '1. Set missing environment variables in your deployment platform'
      );
      console.log('2. Run this script again to verify');
      console.log('3. Check the DEPLOYMENT-GUIDE.md for detailed instructions');
      process.exit(1);
    }
  }
}

main();
