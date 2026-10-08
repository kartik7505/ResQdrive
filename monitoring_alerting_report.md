# Monitoring & Telemetry Report

This document outlines the architecture of the Admin Monitoring Dashboard, the error tracking systems, and strategies for configuring actionable alerts.

## 1. Admin Dashboard Capabilities
The monitoring dashboard has been upgraded to provide deep visibility into system health and user telemetry:
- **System Health Overview**: A new section actively pings the backend `/readiness` checks to report API Status, Database Health, Latency (in milliseconds), and Background Job status.
- **Grouped Error Tracking**: Instead of listing endless rows of identical errors, the "Errors" tab now mathematically groups errors by exact message and category. It displays the **Occurrence Count**, **First Seen**, and **Last Seen** timestamps to help you prioritize active, high-volume bugs.
- **Auth & Activity**: The dashboard continues to track real-time logins (success and failures) and user activity streams, securely bound to the authenticated user via Supabase.

## 2. Telemetry Architecture & Protections
To ensure that aggressive tracking does not degrade the core user experience, we implemented the following strategies in previous phases, which are now fully visualized in the admin panel:
- **Batching & Sampling**: The frontend global `ErrorBoundary` and telemetry trackers use fire-and-forget asynchronous functions. They do not block the UI thread. If the telemetry database falls over, the app continues functioning seamlessly.
- **Bounded Buffers**: Telemetry payload limits (10kb) and server-side rate-limits (100 req/min) prevent infinite logging loops from taking down the backend.
- **Redaction**: Auth tokens and sensitive headers are redacted from server logs.
- **Retention Strategy**: As detailed in the background job report, raw telemetry is retained for 7 days before being automatically purged by `pg_cron`.

## 3. Important Caveats (Documented on UI)
The dashboard explicitly states two critical caveats to prevent misinterpretation of the data:
1. **Errors do not capture every crash**: If a mobile browser runs out of memory (OOM kill) or a strict adblocker completely blocks the Supabase domain, the javascript error payload cannot be sent. 
2. **Open session != Online**: Just because a user has a valid session token or triggered an activity event 5 minutes ago does not definitively prove their websocket or screen is actively open right now.

## 4. Alerting Configuration Recommendations
To proactively detect issues before users report them, you should configure the following alerts in your hosting provider (e.g., Vercel / Supabase Dashboard) or APM tool (e.g., Datadog / Sentry):
- **Error Rate Spikes**: Alert if grouped errors exceed 50 occurrences within a 5-minute window.
- **Latency Thresholds**: Alert if the P95 latency of `/api/emergency/dispatch` exceeds 1000ms.
- **Database Pressure**: Alert if the Postgres connection pool usage exceeds 80% (400 connections) for more than 2 minutes.
- **Queue Delays**: Alert if the `pg_cron` daily aggregation job (`cron.job_run_details`) reports a `status` of `failed`.
