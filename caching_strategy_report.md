# Caching and Traffic Protection Strategy

This document outlines the multi-layered caching architecture and traffic protection boundaries implemented to ensure stability under heavy load.

## 1. CDN Edge Caching (Vercel / Cloudflare)
A `vercel.json` configuration file was added to strictly control downstream CDN caching behaviors.
- **Static Assets**: JavaScript chunks, CSS, and images (compiled by Vite with content hashes in the filename) are served with `Cache-Control: public, max-age=31536000, immutable`. This allows edge nodes and browsers to cache them forever.
- **Public HTML**: `index.html` is served with `Cache-Control: public, max-age=0, must-revalidate`. This ensures the browser always checks the edge node for a new version of the app, preventing users from getting stuck on an old client.

## 2. Server-Side Caching & Database Protection
The Node.js backend handles expensive operations (like paginated admin user lookups) using a layered cache architecture.

### 2.1 Private Data Isolation
To prevent shared caches (like Cloudflare) from accidentally leaking an admin's dashboard data to another user, all authenticated API endpoints inject a strict `Cache-Control: private, no-cache, no-store, must-revalidate` header. 

### 2.2 Promise Coalescing (Thundering Herd Protection)
If a cache key expires and 100 concurrent requests hit the `/api/admin/users` endpoint simultaneously, a naive cache implementation would send 100 identical queries to the database. 
- **Implementation**: We implemented **Promise Coalescing** (`pendingQueries`). The first request creates a promise that queries the database. The subsequent 99 requests immediately attach to that same pending promise instead of hitting the database.

### 2.3 Stale Data Fallback (Circuit Breaking)
If the database connection pool is overwhelmed or times out, the backend gracefully degrades rather than failing completely.
- **Implementation**: The cache stores a permanent `staleData` fallback payload. If a database query throws an error (or times out via the 5000ms global timeout we added earlier), the API intercepts the failure and returns the stale fallback data to the client with a `source: 'stale_fallback'` meta flag.

## 3. Distributed Rate Limiting & WAF
- **NAT / Shared IPs**: The in-memory rate limiter accounts for `req.connection.remoteAddress` or `X-Forwarded-For` headers. Because multiple legitimate mobile users might share an IP via a cellular carrier's NAT, the burst allowance is set generously to `100 requests per minute`.
- **WAF Layer**: It is strongly recommended to enable **Cloudflare WAF** or **Vercel Firewall** in front of this backend to absorb layer 7 DDoS floods before they reach the Express rate limiter.

## 4. Cache Keys & Invalidation
- **Cache Keys**: Keys are stringified predictably, e.g., `admin:users:p1:l20` for page 1, limit 20.
- **Expiration**: Standard cache TTL is bounded to 60 seconds for administrative data, ensuring memory is recycled frequently while absorbing traffic spikes.
