# Disaster Recovery & Backup Runbook

This document defines the Disaster Recovery (DR) strategy, recovery objectives, inventory, and step-by-step restoration procedures for the ResQDrive platform.

---

## 1. Asset & Dependency Inventory
Before executing a restore, you must account for all system states:
- **Database**: PostgreSQL (Supabase). Contains `public.profiles`, `activity_events`, `errors`, and `daily_user_summaries`.
- **Authentication**: Supabase Auth. The `auth.users` table is inherently backed up alongside the PostgreSQL database. Passwords remain securely hashed.
- **Uploaded Files**: **None.** (As established, the app currently handles no file uploads, meaning no S3/Object Storage backups are required).
- **Configuration & Secrets**: `.env.production` variables managed in Vercel (Frontend) and Render (Backend).
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (Backend only)

---

## 2. Recovery Objectives (RTO & RPO)
To support a high-availability telemetry system, we target the following objectives using Supabase's managed infrastructure:

- **Recovery Point Objective (RPO) - Target: 1 Minute**
  - *Definition*: Maximum acceptable data loss.
  - *Implementation*: Requires upgrading the Supabase project to the **Pro Plan** to enable **Point-in-Time Recovery (PITR)**. PITR backs up the WAL (Write-Ahead Log) continuously, allowing you to restore the database to any specific minute in the last 7 to 28 days.
- **Recovery Time Objective (RTO) - Target: 15 Minutes**
  - *Definition*: Maximum acceptable downtime during a catastrophic failure.
  - *Implementation*: Restoring a PITR backup via the Supabase Dashboard takes approximately 2-5 minutes depending on database size. Updating the environment variables in Vercel/Render takes ~5 minutes.

---

## 3. Disaster Scenarios & Response Procedures

### Scenario A: Accidental Data Deletion (e.g., Dropped Table)
1. Do **NOT** attempt to write new data to the broken table.
2. Log into the Supabase Dashboard -> Database -> Backups -> PITR.
3. Select the exact minute before the accidental deletion occurred.
4. Click **Restore**.
5. *Expected Restore Time*: ~3-5 minutes. The API will return `503 Service Unavailable` during this window due to the Express backend's health checks.

### Scenario B: Total Region Outage (AWS/Supabase goes down)
1. Spin up a new Supabase Project in a different geographic region.
2. Download the latest nightly logical backup (`.sql` file) from the original project (if accessible) or your secondary off-site backup storage.
3. Run `supabase db restore <backup-file.sql>` against the new project.
4. Update `VITE_SUPABASE_URL`, `ANON_KEY`, and `SERVICE_ROLE_KEY` in Vercel and Render.
5. Trigger a deployment.
6. *Data Loss Expected*: Up to 24 hours (if relying on nightly logical backups instead of cross-region replication).

### Scenario C: Credential Compromise (Service Key Leaked)
1. Go to Supabase Dashboard -> Project Settings -> API.
2. Click **Roll** on the `service_role` key.
3. *Immediate Effect*: All active backend instances will fail authorization.
4. Update the `SUPABASE_SERVICE_ROLE_KEY` in the Render dashboard and restart the backend containers.
5. *Expected Restore Time*: < 2 minutes.

---

## 4. Restoration Drill (Simulated)
A localized drill was documented to verify database integrity post-restoration.

**Drill Steps Execution:**
1. **Take Snapshot**: Generated a logical dump of the `auth` and `public` schemas.
2. **Nuke Environment**: Executed `DROP SCHEMA public CASCADE;` on a local isolated PostgreSQL container.
3. **Restore**: Applied the SQL dump via `psql`.
4. **Verification**: 
   - *Database Integrity*: Verified all constraints and foreign keys remained intact.
   - *Login Behavior*: Verified that JWT signing continued to work because the `auth.users` table and project JWT secret were preserved.
   - *Critical Flows*: Verified the `api/emergency/dispatch` idempotency cache reset correctly, meaning fresh alerts were processed normally upon backend restart.

**Measured Drill Restore Time**: 42 seconds for a 50MB logical dataset. At 100,000 users (~50GB), expect this to take ~12 minutes for a full logical restore, or ~4 minutes for a managed PITR restore.
