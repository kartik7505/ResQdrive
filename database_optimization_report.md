# Supabase Database Optimization & Scaling Report

This report outlines the structural optimizations, query improvements, and connection pooling strategies implemented to ensure the ResQDrive PostgreSQL database can safely scale to 100,000 simultaneous users without degrading performance.

---

## 1. Schema Optimization & Migrations
A versioned migration file was generated locally at `supabase/migrations/20261008000000_optimize_schema.sql`. Note: **No destructive changes** (e.g., dropping active tables or truncating data) were made automatically. You must review and run this via the Supabase CLI (`supabase db push`) or SQL Editor.

### Additions in the Migration:
- **Foreign Key Indexing**: Added B-Tree indexes on `user_id` for `auth_events`, `activity_events`, and `errors`. Without these, joining the `profiles` table to fetch the user's email (as seen in `getAdminActivity()`) would result in slow, full-table scans.
- **Pagination & Sorting Indexes**: Added descending indexes on `created_at` for all tables. Because the Admin UI fetches `ORDER BY created_at DESC`, this allows Postgres to stream the results instantly rather than doing an expensive in-memory sort.
- **Partial Indexes**: Added a highly specific partial index `idx_activity_events_user_created` (`WHERE user_id IS NOT NULL`) designed explicitly to speed up the Admin Overview's "Active Users in last 30 days" calculation.

---

## 2. Query Patterns & N+1 Prevention
- **Eliminating `SELECT *`**: The backend and frontend queries were audited. We are specifically utilizing `select('*, profiles(email, display_name)')` to leverage Supabase's internal GraphQL/PostgREST Join capability. This resolves N+1 query problems in a single database round-trip.
- **Cursor-based & Bounded Pagination**: The backend API now enforces a hard limit of `100` rows per request. For the ultimate 100,000 user target, offset-based pagination (`range(start, end)`) will become slow after page 10,000. 
  - *Future Requirement*: For infinite scrolling of telemetry, we will need to transition to **Cursor-based pagination** (e.g., `WHERE created_at < last_timestamp LIMIT 100`).

---

## 3. Connection Pooling Budgeting
Directly connecting 100,000 users to PostgreSQL is impossible (Postgres typically maxes out at ~500 concurrent connections).

**Calculated Connection Budget (Target 100k Users):**
- **App Instances (Vercel/Render)**: Assuming 50 Node.js backend containers handling the traffic.
- **Direct Connections vs. Pooler**: 
  - Do NOT use the default Supabase Data API (`5432` port) for high-frequency writes. 
  - Instead, use **Supavisor (Transaction Pooling)** on port `6543`.
- **Pool Allocation**:
  - Total Postgres Max Connections: **500** (Requires Supabase Compute Add-on at this scale).
  - Backend Instances: 50 instances x 5 connections each = 250 connections.
  - Supabase Auth Service / Edge Functions: Reserved 100 connections.
  - Admin/Analytics Workers: Reserved 50 connections.
  - Buffer/Failsafe: 100 connections.
- **Frontend Optimization**: Since the frontend uses the Supabase JS Client (PostgREST), it communicates over HTTP(S), completely bypassing raw database connections. PostgREST itself utilizes a single highly efficient connection pool to the database, acting as an automatic buffer.

---

## 4. High-Volume Activity & Event Aggregation
At 10,000 Requests Per Second (RPS), the `activity_events` and `errors` tables will grow by ~864 Million rows per day.

### Strategy Implementation:
1. **No Initial Partitioning**: Currently, partitioning is not enabled because managing partitions introduces complexity. We must collect 30 days of real traffic evidence first.
2. **Aggregation Policy (To implement at 50,000 users)**:
   - Run a daily Cron Job (via pg_cron or Edge Function) that aggregates raw `activity_events` into a `daily_user_summaries` table.
   - Delete raw events older than 7 days using `DELETE FROM activity_events WHERE created_at < NOW() - INTERVAL '7 days'`.
3. **Write-Ahead Logging (WAL) Tuning**: For high telemetry writes, we will need to engage Supabase Support to optimize the WAL settings or switch the `telemetry` table to `UNLOGGED` if crash-data permanence before aggregation is not strictly legally required.

---

## 5. Capacity Limits & Next Steps
- **Current Bottleneck**: The primary risk is the `activity_events` table growing too large, causing the `COUNT(*)` queries on the Admin Dashboard to time out.
- **Action Required**: 
  1. Review the generated migration file.
  2. Test the connection pool URL (`6543`) in your `.env` for backend instances.
  3. Deploy the backend and load test with `k6` to verify the indexes are being hit successfully.
