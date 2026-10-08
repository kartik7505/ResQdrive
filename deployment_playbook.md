# Production Deployment & Infrastructure Playbook

This playbook defines the exact configurations, limits, and deployment workflows for the ResQDrive platform, preparing it for 100,000 simultaneous users. **No infrastructure has been purchased and no load tests have been executed; this is the finalized proposed architecture.**

## 1. Environments & Secure Variables
Three environment configs have been created:
- `.env.development`
- `.env.staging` (Uses a separate staging database to safely test schema migrations)
- `.env.production` 
**Security Protocol**: Private keys (like `SUPABASE_SERVICE_ROLE_KEY`) are excluded from version control and must be injected directly into the hosting provider's secret manager.

## 2. Infrastructure Specifications (Proposed)

### Frontend (Vercel)
- **Deployment**: Automatic deployments linked to the `main` branch. 
- **Domain & HTTPS**: Vercel handles automated SSL certificate provisioning and global edge CDN caching.
- **Build Checks**: Vercel will block deployment if `npm run build` fails (which includes TypeScript/ESLint checks if configured).

### Backend API (Render / PaaS)
A `render.yaml` file has been provided to define the backend infrastructure as code.
- **Autoscaling**: Configured with a `minInstances: 2` to prevent cold starts and ensure high availability if one instance restarts. `maxInstances: 50` acts as a hard spending limit.
- **Scaling Metrics**: Autoscales when average CPU hits 60% or Memory hits 70%.
- **Load Balancing**: The PaaS automatically handles load balancing across these instances and injects the `X-Forwarded-For` header for our rate limiter.

### Database Capacity Budgeting
*Adding API servers does NOT increase database capacity.*
- **Maximum API Instances**: 50
- **Connections per Instance**: 5
- **Total Backend DB Connections**: 250
- **Remaining Quota**: 250 connections remain for Supabase Auth, Webhooks, and Admin workers out of the 500 max limit.
- **Action Required**: The backend must use the **Supavisor Transaction Pooler** (port `6543`), not the direct database port (`5432`).

## 3. Resilience Under Overload
- **Slow Dependencies**: The backend Express server enforces a strict `5000ms` global timeout. If Supabase is slow, the API will fast-fail with a `503 Service Unavailable`, preventing connection starvation.
- **Graceful Shutdown**: The backend intercepts `SIGTERM` (sent during scale-down or redeploy) to finish processing active dispatches before terminating, preventing dropped emergency alerts.
- **Expensive Operations**: If the database lookup for the Admin Users table fails under heavy load, the caching layer acts as a circuit breaker, automatically serving stale memory data instead of throwing an error.

## 4. Safe Deployment & Rollback Workflow
To deploy safely without downtime:
1. **Backward-Compatible Migrations**: Never drop a column or rename a table in a single deployment. If a column is deprecated, deploy the code that ignores the column *first*, verify stability, and drop the column in a later migration.
2. **Staging Verification**: All SQL migrations must be run against the Staging Supabase project first. 
3. **Rollbacks**: Because database migrations are additive and backward-compatible, if the Vercel frontend or Render backend exhibits high error rates, you can click "Rollback to previous deployment" instantly without needing to reverse the database schema.
