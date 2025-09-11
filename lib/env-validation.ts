/**
 * Environment Variables Validation
 *
 * This module validates that all required environment variables are present
 * and properly configured for the application to function correctly.
 */

interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  errors: string[];
}

const REQUIRED_ENV_VARS = [
  // Authentication & Security
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_ID',
  'GOOGLE_SECRET',

  // Database & Storage
  'SANITY_PROJECT_ID',
  'SANITY_DATASET',
  'SANITY_API_TOKEN',

  // Payment Processing
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',

  // Email Services
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SUPPORT_EMAIL',

  // Application Configuration
  'NEXT_PUBLIC_BASE_URL',

  // External Services
  'EASYPOST_API_KEY',
  'RESEND_API_KEY',
  'ANTHROPIC_API_KEY',
  'MAILCHIMP_API_KEY',
] as const;

const OPTIONAL_ENV_VARS = [
  'SANITY_API_VERSION',
  'SANITY_WRITE_TOKEN',
  'REDIS_URL',
  'NEXT_PUBLIC_FACEBOOK_PIXEL_ID',
  'NEXT_PUBLIC_DISABLE_VITALS',
  'NEXT_PUBLIC_SENTRY_DSN',
  'CHECKOUT_V2_ENABLED',
  'CHECKOUT_V2_PERCENT',
  'PLATFORM_FEE_BPS',
  'BUNDLE_BUDGET_BYTES',
  'SC_DISABLE_SPEEDY',
  'PLAYWRIGHT_BASE_URL',
  'CI',
  'NODE_ENV',
] as const;

const SENSITIVE_VARS = [
  'NEXTAUTH_SECRET',
  'GOOGLE_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SANITY_API_TOKEN',
  'SANITY_WRITE_TOKEN',
  'SMTP_PASS',
  'ANTHROPIC_API_KEY',
  'MAILCHIMP_API_KEY',
  'EASYPOST_API_KEY',
  'RESEND_API_KEY',
] as const;

/**
 * Validates environment variables and returns a detailed result
 */
export function validateEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    missing: [],
    warnings: [],
    errors: [],
  };

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      result.missing.push(varName);
      result.isValid = false;
    }
  }

  // Check for sensitive variables in client-side code
  if (typeof window !== 'undefined') {
    for (const varName of SENSITIVE_VARS) {
      if (process.env[varName] && !varName.startsWith('NEXT_PUBLIC_')) {
        result.warnings.push(
          `Sensitive variable ${varName} should not be accessible in client-side code`
        );
      }
    }
  }

  // Validate specific formats
  validateStripeKeys(result);
  validateEmailConfiguration(result);
  validateSanityConfiguration(result);
  validateUrlConfiguration(result);

  return result;
}

/**
 * Validates Stripe configuration
 */
function validateStripeKeys(result: EnvValidationResult): void {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (secretKey && !secretKey.startsWith('sk_')) {
    result.errors.push('STRIPE_SECRET_KEY should start with "sk_"');
    result.isValid = false;
  }

  if (publishableKey && !publishableKey.startsWith('pk_')) {
    result.errors.push(
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should start with "pk_"'
    );
    result.isValid = false;
  }

  if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
    result.errors.push('STRIPE_WEBHOOK_SECRET should start with "whsec_"');
    result.isValid = false;
  }

  // Check for test vs live keys mismatch
  if (secretKey && publishableKey) {
    const secretIsTest = secretKey.startsWith('sk_test_');
    const publishableIsTest = publishableKey.startsWith('pk_test_');

    if (secretIsTest !== publishableIsTest) {
      result.warnings.push(
        'STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should both be test or live keys'
      );
    }
  }
}

/**
 * Validates email configuration
 */
function validateEmailConfiguration(result: EnvValidationResult): void {
  const smtpPort = process.env.SMTP_PORT;
  const smtpHost = process.env.SMTP_HOST;
  const supportEmail = process.env.SUPPORT_EMAIL;

  if (
    smtpPort &&
    (isNaN(Number(smtpPort)) ||
      Number(smtpPort) < 1 ||
      Number(smtpPort) > 65535)
  ) {
    result.errors.push('SMTP_PORT must be a valid port number (1-65535)');
    result.isValid = false;
  }

  if (smtpHost && !smtpHost.includes('.')) {
    result.warnings.push('SMTP_HOST should be a valid hostname');
  }

  if (supportEmail && !supportEmail.includes('@')) {
    result.errors.push('SUPPORT_EMAIL should be a valid email address');
    result.isValid = false;
  }
}

/**
 * Validates Sanity configuration
 */
function validateSanityConfiguration(result: EnvValidationResult): void {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  const apiVersion = process.env.SANITY_API_VERSION;

  if (projectId && projectId.length < 8) {
    result.warnings.push(
      'SANITY_PROJECT_ID seems too short for a valid project ID'
    );
  }

  if (dataset && !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(dataset)) {
    result.warnings.push(
      'SANITY_DATASET should contain only lowercase letters, numbers, and hyphens'
    );
  }

  if (apiVersion && !/^\d{4}-\d{2}-\d{2}$/.test(apiVersion)) {
    result.warnings.push('SANITY_API_VERSION should be in YYYY-MM-DD format');
  }
}

/**
 * Validates URL configuration
 */
function validateUrlConfiguration(result: EnvValidationResult): void {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  if (baseUrl && !isValidUrl(baseUrl)) {
    result.errors.push('NEXT_PUBLIC_BASE_URL should be a valid URL');
    result.isValid = false;
  }

  if (nextAuthUrl && !isValidUrl(nextAuthUrl)) {
    result.errors.push('NEXTAUTH_URL should be a valid URL');
    result.isValid = false;
  }

  // Check for localhost in production
  if (process.env.NODE_ENV === 'production') {
    if (baseUrl && baseUrl.includes('localhost')) {
      result.warnings.push(
        'NEXT_PUBLIC_BASE_URL should not use localhost in production'
      );
    }
    if (nextAuthUrl && nextAuthUrl.includes('localhost')) {
      result.warnings.push(
        'NEXTAUTH_URL should not use localhost in production'
      );
    }
  }
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets a summary of environment configuration
 */
export function getEnvironmentSummary(): {
  environment: string;
  hasRedis: boolean;
  hasSentry: boolean;
  hasFacebookPixel: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
} {
  return {
    environment: process.env.NODE_ENV || 'development',
    hasRedis: !!process.env.REDIS_URL,
    hasSentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    hasFacebookPixel: !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
  };
}

/**
 * Logs environment validation results
 */
export function logEnvironmentValidation(): void {
  const validation = validateEnvironment();
  const summary = getEnvironmentSummary();

  console.log('🔍 Environment Validation Results:');
  console.log(`Environment: ${summary.environment}`);
  console.log(`Valid: ${validation.isValid ? '✅' : '❌'}`);

  if (validation.missing.length > 0) {
    console.log('❌ Missing required variables:');
    validation.missing.forEach(varName => console.log(`  - ${varName}`));
  }

  if (validation.errors.length > 0) {
    console.log('❌ Configuration errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  // Log optional variables that are present
  const optionalPresent = OPTIONAL_ENV_VARS.filter(key => process.env[key]);
  if (optionalPresent.length > 0) {
    console.log('ℹ️  Present optional variables:');
    optionalPresent.forEach(key => {
      const value = process.env[key];
      const displayValue = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') 
        ? '***' + (value?.slice(-4) || '')
        : value;
      console.log(`  - ${key}: ${displayValue}`);
    });
  }

  console.log('📊 Feature Status:');
  console.log(`  Redis: ${summary.hasRedis ? '✅' : '❌'}`);
  console.log(`  Sentry: ${summary.hasSentry ? '✅' : '❌'}`);
  console.log(`  Facebook Pixel: ${summary.hasFacebookPixel ? '✅' : '❌'}`);
}

/**
 * Throws an error if environment validation fails
 */
export function requireValidEnvironment(): void {
  const validation = validateEnvironment();

  if (!validation.isValid) {
    const errorMessage = [
      'Environment validation failed:',
      ...validation.missing.map(varName => `  - Missing: ${varName}`),
      ...validation.errors.map(error => `  - Error: ${error}`),
    ].join('\n');

    throw new Error(errorMessage);
  }
}

// Auto-validate in development
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  logEnvironmentValidation();
}
