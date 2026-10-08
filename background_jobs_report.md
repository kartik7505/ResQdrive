# Background Jobs & Infrastructure Report

This report evaluates the application for slow or heavy asynchronous tasks (email delivery, exports, image processing, object storage) and documents the architectural decisions made in accordance with the principle of avoiding unnecessary infrastructure bloat.

## 1. Application Inspection Findings

After inspecting the frontend (`React/Vite`), backend (`Express`), and database (`Supabase Postgres`) codebases, here are the findings regarding slow workload requirements:

- **Image Processing & File Uploads**: The application **does not currently implement any user-facing file uploads**. The "Camera" and "Mic" toggles on the dashboard simulate telemetry state, but no actual video/audio files or insurance documents are uploaded to the backend.
- **Exports & Heavy Report Generation**: There are currently no CSV/PDF export endpoints in the Admin Dashboard.
- **Email Delivery**: User authentication emails (verification, password resets) are natively handled by Supabase Auth's internal Go-based worker queues. The application backend does not need to send manual SMTP emails.
- **Analytics Aggregation**: The application *does* generate a massive volume of raw telemetry (`activity_events`). Aggregating this data for the Admin Dashboard is the only identified "slow work" that must run asynchronously.

### Decision: Avoid Unnecessary Infrastructure
Because the application currently lacks file uploads and complex external processing tasks, **I have intentionally opted NOT to configure Supabase Storage (S3 object storage) or add an external message queue like Redis/BullMQ/RabbitMQ.** Doing so would introduce unnecessary infrastructure overhead, maintenance burden, and costs for features that do not yet exist in the codebase.

---

## 2. Implemented Background Job: Analytics Aggregation

To handle the one necessary background task—Analytics Aggregation—we are leveraging **`pg_cron`**, a durable, built-in job scheduler for PostgreSQL provided by Supabase. This eliminates the need for an external worker Node.js container.

I have created a migration script (`supabase/migrations/20261008000001_pg_cron_analytics.sql`) that defines the worker logic.

### 2.1 Idempotency & Duplicate Protection
The worker (`public.aggregate_daily_analytics()`) aggregates the previous day's telemetry into a `daily_user_summaries` table. 
- It uses a PostgreSQL `UPSERT` (`ON CONFLICT DO UPDATE`). 
- **Idempotent by Design**: If the cron job fails midway, retries unexpectedly, or is triggered manually twice, it will simply overwrite the existing aggregated row with the exact same data. It is mathematically impossible for a retry to cause "duplicate business actions."

### 2.2 Cleanup & Retention
After aggregating the data, the worker executes a cleanup routine:
- `DELETE FROM public.activity_events WHERE created_at < NOW() - INTERVAL '7 days';`
This automatically purges raw, high-volume telemetry that has already been aggregated, keeping the primary tables lean and fast.

### 2.3 Failed Job Handling & Reporting
Because this job runs inside Supabase Postgres via `pg_cron`, job execution logs, successes, and failures are automatically recorded in the `cron.job_run_details` table. The database administrator can query this table at any time to inspect worker restarts, timeouts, or failures.
