# API Contract & Deployment Requirements

This document outlines the API contracts for the privileged operations handled by the hardened Node.js backend, alongside deployment and environment requirements.

## 1. Backend Architecture Principles
- **Statelessness**: The API tier does not rely on local disk or local memory for durable state. (Idempotency cache should use Redis in production).
- **Graceful Shutdown**: Intercepts `SIGINT`/`SIGTERM` to drain active connections before container termination.
- **Resilience**: Enforces 10KB JSON limits, 5-second request timeouts, and max pagination bounds (100 items).

---

## 2. Environment Variables & Secrets
To deploy this backend, the following environment variables are required. Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend or version control.

```env
PORT=3001
VITE_SUPABASE_URL=https://<your-project>.supabase.co
# CRITICAL: Service Role Key bypasses Row Level Security (RLS)
SUPABASE_SERVICE_ROLE_KEY=ey...
```

---

## 3. API Contracts

### 3.1 Health & Readiness Probes
Used by Kubernetes or Load Balancers to determine instance health.

**GET `/health`**
- **Description**: Fast check to verify the HTTP server is accepting connections.
- **Response `200 OK`**: `{ "status": "UP" }`

**GET `/readiness`**
- **Description**: Deep check to verify the server can connect to downstream dependencies (Supabase).
- **Response `200 OK`**: `{ "status": "READY" }`
- **Response `503 Service Unavailable`**: `{ "status": "DOWN", "reason": "Database connection failed" }`

---

### 3.2 Privileged Operations

**POST `/api/emergency/dispatch`**
- **Description**: Securely dispatches emergency services. Requires user authentication. Protects against duplicate requests via idempotency.
- **Headers**:
  - `Authorization: Bearer <Supabase_JWT>`
- **Body**:
  ```json
  {
    "lat": 29.2183,
    "lng": 79.5126,
    "severity": "high",
    "idempotency_key": "uuid-1234-5678" // Optional, prevents duplicate dispatch within 5 minutes
  }
  ```
- **Responses**:
  - `200 OK`: `{ "message": "Emergency services dispatched", "event_id": 42 }`
  - `400 Bad Request`: `{ "error": "Bad Request", "message": "Valid lat and lng required" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized", "message": "Invalid token" }`

---

### 3.3 Admin Data Fetching (Bounded Pagination)

**GET `/api/admin/users?page=1&limit=20`**
- **Description**: Fetch registered users. Restricted to users with the `admin` role. Max limit is capped at 100.
- **Headers**:
  - `Authorization: Bearer <Supabase_JWT>`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "data": [
        { "id": "...", "email": "admin@resqdrive.com", "role": "admin" }
      ],
      "meta": { "page": 1, "limit": 20, "total": 1 }
    }
    ```
  - `403 Forbidden`: `{ "error": "Forbidden", "message": "Admin access required" }`

---

## 4. Operational Requirements

### 4.1 Deployment (Docker / PaaS)
- The application should be run in clustered mode or behind a Load Balancer (e.g., AWS ALB, Render, or Railway).
- The load balancer must pass `X-Forwarded-For` so the API can log accurate IPs.

### 4.2 Logging & Observability
- **Structured Logs**: Logs are emitted to `stdout` in JSON format.
- **Sensitive Data**: The `Authorization` header is stripped and redacted (`[REDACTED]`) before logging.
- **Request Tracing**: Every request is injected with a unique `req_id` (UUIDv4) that persists through the request lifecycle.
