# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD pipeline setup for the M4ktaba project.

## Overview

The CI/CD pipeline includes:

- **Continuous Integration**: Automated testing, linting, type checking, and security scanning
- **Continuous Deployment**: Automated deployment to staging and production environments
- **Quality Assurance**: Code quality checks, performance testing, and accessibility testing
- **Maintenance**: Automated dependency updates and system health monitoring

## Pipeline Structure

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

- **Lint & Type Check**: ESLint and TypeScript validation
- **Security Audit**: Dependency vulnerability scanning with Snyk
- **Unit Tests**: Jest tests with coverage reporting
- **Integration Tests**: API and database integration tests
- **Build Test**: Production build verification
- **E2E Tests**: Playwright end-to-end testing
- **Performance Tests**: Lighthouse CI performance auditing
- **Code Quality**: Prettier formatting and SonarCloud analysis

### 2. Deployment Pipeline (`.github/workflows/deploy.yml`)

**Triggers:**

- Push to `main` branch (staging)
- Manual workflow dispatch (production)

**Environments:**

- **Staging**: Automatic deployment on main branch push
- **Production**: Manual deployment with approval gates

**Features:**

- Vercel deployment integration
- Fly.io workers deployment
- Smoke testing after deployment
- GitHub releases creation
- Slack notifications

### 3. Maintenance Pipeline (`.github/workflows/maintenance.yml`)

**Triggers:**

- Weekly schedule (Mondays at 2 AM UTC)
- Manual workflow dispatch

**Tasks:**

- Dependency updates with automated PR creation
- Security audit and vulnerability scanning
- Performance monitoring and bundle analysis
- Database maintenance and optimization
- System health checks

## Configuration Files

### Testing Configuration

#### Jest (`jest.config.js`)

- Unit and integration test configuration
- Coverage reporting with 70% threshold
- Mock configurations for Next.js, Stripe, and other services
- Test environment setup

#### Playwright (`playwright.config.ts`)

- E2E test configuration
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Global setup and teardown

#### Lighthouse CI (`lighthouserc.json`)

- Performance, accessibility, SEO, and PWA auditing
- Performance score thresholds (80% minimum)
- Accessibility score thresholds (90% minimum)

### Code Quality

#### Prettier (`.prettierrc`)

- Code formatting standards
- Consistent code style across the project

#### ESLint (`.eslintrc.json`)

- Code linting rules
- Next.js specific configurations
- TypeScript integration

#### Husky (`.husky/`)

- Pre-commit hooks for code quality
- Commit message validation
- Automated testing before commits

#### Lint-staged (`.lintstagedrc.js`)

- Staged file linting and formatting
- Optimized for performance

### Security

#### Dependabot (`.github/dependabot.yml`)

- Automated dependency updates
- Security vulnerability monitoring
- Automated PR creation for updates

#### Snyk Integration

- Security vulnerability scanning
- Dependency risk assessment
- Automated security reporting

## Environment Variables

### Required Secrets

#### GitHub Secrets

- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `SNYK_TOKEN`: Snyk security scanning token
- `SONAR_TOKEN`: SonarCloud analysis token
- `SLACK_WEBHOOK`: Slack notification webhook
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry client DSN
- `SENTRY_DSN`: Sentry server DSN

### Environment Configuration

- Staging: `NODE_ENV=production` with staging URLs
- Production: `NODE_ENV=production` with production URLs

## Deployment Process

### Staging Deployment

1. Code pushed to `main` branch
2. CI pipeline runs all checks
3. Build artifacts created
4. Deploy to Vercel staging
5. Smoke tests executed
6. Slack notification sent

### Production Deployment

1. Manual trigger via GitHub Actions
2. Staging deployment verification
3. Production deployment to Vercel
4. Fly.io workers deployment
5. Production smoke tests
6. GitHub release created
7. Slack notification sent

## Monitoring and Alerts

### Health Checks

- Application health endpoint (`/api/health`)
- Service status monitoring
- Performance metrics tracking

### Notifications

- Slack integration for deployment status
- GitHub notifications for failed builds
- Email alerts for critical issues

### Logging

- Structured logging with Sentry
- Performance monitoring
- Error tracking and alerting

## Local Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (optional)

### Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Format code
pnpm format
```

### Docker Development

```bash
# Start development environment
docker-compose up dev

# Start production environment
docker-compose up app
```

## Best Practices

### Commit Messages

- Use conventional commit format
- Include scope and description
- Reference issues when applicable

### Code Quality

- Write tests for new features
- Maintain test coverage above 70%
- Follow linting and formatting rules
- Use TypeScript for type safety

### Security

- Regular dependency updates
- Security vulnerability scanning
- Secure coding practices
- Environment variable protection

### Performance

- Lighthouse CI performance monitoring
- Bundle size analysis
- Image optimization
- Code splitting

## Troubleshooting

### Common Issues

#### Build Failures

- Check TypeScript errors
- Verify all dependencies are installed
- Check environment variables

#### Test Failures

- Review test output for specific errors
- Check mock configurations
- Verify test environment setup

#### Deployment Issues

- Check Vercel deployment logs
- Verify environment variables
- Check service health status

### Debug Commands

```bash
# Debug Jest tests
pnpm test:debug

# Debug Playwright tests
pnpm test:e2e --debug

# Check build locally
pnpm build

# Analyze bundle size
pnpm analyze
```

## Maintenance

### Weekly Tasks

- Review dependency updates
- Check security audit results
- Monitor performance metrics
- Review system health

### Monthly Tasks

- Update CI/CD configurations
- Review and update test coverage
- Performance optimization review
- Security audit review

## Support

For issues with the CI/CD pipeline:

1. Check GitHub Actions logs
2. Review this documentation
3. Check project issues
4. Contact the development team

## Contributing

When contributing to the CI/CD pipeline:

1. Test changes locally
2. Create a feature branch
3. Submit a pull request
4. Ensure all checks pass
5. Get code review approval
