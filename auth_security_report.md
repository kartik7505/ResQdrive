# Authentication & Security Implementation Report

This report outlines the production-grade authentication and authorization strategy implemented via Supabase Auth and the Node.js API Gateway.

## 1. Auth Flows Implemented
The `src/lib/api.js` client has been upgraded to support the full Supabase Auth lifecycle:
- **Registration**: Signs users up and triggers a database function to provision their profile.
- **Login**: Secure password-based authentication.
- **Password Reset**: Added `resetPassword(email)` and `updatePassword(newPassword)`.
- **Session Renewal**: Integrated `supabase.auth.onAuthStateChange`. Supabase handles JWT background refresh natively. The UI is now listening for `SIGNED_OUT` events to synchronously clear local storage tokens if a session expires or is revoked.

## 2. Server-Side Security Hardening (`server/index.js`)
We implemented critical middleware to protect against brute-force and injection attacks:
- **Security Headers**: Added `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, and HSTS headers to prevent Clickjacking and Cross-Site Scripting (XSS).
- **CORS Constraints**: Explicitly restricts origins and allows only `GET` and `POST`.
- **Rate Limiting**: Implemented a memory-based rate limiter (max 100 requests per minute per IP) to prevent endpoint enumeration and brute force bursts against the dispatch API.
- **Payload Limits**: Dropped `express.json` limit to `10kb` to thwart memory exhaustion.

## 3. Privilege Management & RLS Verification
Role assignment is strictly managed on the server.
- **First Admin Assignment**: In `supabase_schema.sql`, the database trigger `handle_new_user()` is configured to check if the total user count is `0`. The *very first* user to register is automatically granted the `admin` role. All subsequent users default to `user`.
- **Untrusted Clients**: The `public.profiles` table has *no* `UPDATE` policy exposed for the `role` column. A client cannot edit their own role payload to maliciously elevate their privileges.
- **RLS Isolation**: `SELECT` policies dictate that `auth.uid() = id`. A regular user attempting to fetch `activity_events` or `profiles` belonging to another user will receive an empty array `[]` silently. Only users with the `admin` role bypass this.

## 4. Secret Management
- **No Plaintext Logging**: The backend middleware redacts `req.headers.authorization` before emitting the structured logs to `stdout`.
- **Storage**: User passwords are mathematically salted and hashed by Supabase Auth (Argon2id). They are never visible to you, the developers, or the API.

## 5. Provider Limits (Supabase)
Be aware of the following Supabase defaults that will affect production login bursts:
- **Email Rate Limits**: By default, Supabase limits Auth emails (Sign up, Password Reset) to **30 emails per hour** per IP to prevent spam. You must configure a custom SMTP provider (like Resend or SendGrid) in the Supabase Dashboard to bypass this limit for production traffic.
- **Token Expiry**: JWTs expire every 3600 seconds (1 hour). The JS client refreshes them automatically. Do not cache JWTs indefinitely in the backend.
