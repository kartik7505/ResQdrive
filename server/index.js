import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase Admin Client (Privileged Server-Side Client)
// Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// 1. Request IDs & Structured Logging (Sensitive Data Redacted)
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Redact sensitive tokens in logs
    const authHeader = req.headers.authorization ? '[REDACTED]' : 'None';
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      req_id: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration_ms: duration,
      auth: authHeader,
      ip: req.ip
    }));
  });
  next();
});

// 1.1 Security Headers (Anti-XSS, Clickjacking, MIME sniffing)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// 1.2 Rate Limiting (In-memory, basic protection against burst brute-force)
const rateLimitMap = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const current = rateLimitMap.get(ip) || { count: 0, time: Date.now() };
  
  if (Date.now() - current.time > 60000) {
    current.count = 1;
    current.time = Date.now();
  } else {
    current.count++;
  }
  
  rateLimitMap.set(ip, current);
  
  if (current.count > 100) {
    return res.status(429).json({ error: 'Too Many Requests', message: 'Rate limit exceeded' });
  }
  next();
});

// 2. CORS & Request Size Limits
app.use(cors({ origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }));
// Limit JSON payload to 10kb to prevent payload exhaustion attacks
app.use(express.json({ limit: '10kb' }));

// 3. Timeout Middleware (Dependency timeouts)
app.use((req, res, next) => {
  res.setTimeout(5000, () => {
    res.status(503).json({ error: 'Service Unavailable', message: 'Request timeout' });
  });
  next();
});

// 4. Authorization Middleware (Verify JWT with Supabase)
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token' });
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
  req.user = user;
  next();
};

// 5. Health & Readiness Endpoints
app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));
app.get('/readiness', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ status: 'DOWN', reason: 'Supabase client not initialized' });
  }
  try {
    // Simple fast query to check DB connection
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (error) throw error;
    res.status(200).json({ status: 'READY' });
  } catch (err) {
    res.status(503).json({ status: 'DOWN', reason: 'Database connection failed' });
  }
});

// 6. Privileged Operation with Request Validation, Bounded Pagination, and Idempotency
// In-memory idempotency cache (Note: In production with multiple instances, use Redis)
const idempotencyCache = new Map();

app.post('/api/emergency/dispatch', requireAuth, async (req, res) => {
  const { lat, lng, severity, idempotency_key } = req.body;

  // Request Validation
  if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Bad Request', message: 'Valid lat and lng required' });
  }
  
  // Idempotency check to prevent duplicate dispatches
  if (idempotency_key) {
    if (idempotencyCache.has(idempotency_key)) {
      return res.status(200).json(idempotencyCache.get(idempotency_key));
    }
  }

  try {
    // Simulate expensive async job (e.g. contacting emergency services API)
    // We use Supabase Admin to bypass RLS and securely log the dispatch on the server
    const { data, error } = await supabaseAdmin.from('activity_events').insert([{
      user_id: req.user.id,
      event_type: 'emergency_dispatched',
      path: '/api/emergency/dispatch',
      metadata: { lat, lng, severity }
    }]).select().single();

    if (error) throw error;

    const responsePayload = { message: 'Emergency services dispatched', event_id: data.id };
    
    // Store in idempotency cache for 5 minutes
    if (idempotency_key) {
      idempotencyCache.set(idempotency_key, responsePayload);
      setTimeout(() => idempotencyCache.delete(idempotency_key), 5 * 60 * 1000);
    }

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Dispatch error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Cache Configuration (Simulating Redis using a Map with TTLs)
const serverCache = new Map();
// Promise Coalescing to prevent Cache Stampedes (Thundering Herd)
const pendingQueries = new Map();

// Bounded Pagination & Protected Caching Example
app.get('/api/admin/users', requireAuth, async (req, res) => {
  // 1. Prevent shared caches (CDNs) from caching sensitive authenticated data
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  // Authorization verify
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', req.user.id).single();
  if (!profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }

  // Bounded pagination parsing
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 20;
  if (limit > 100) limit = 100; // Hard boundary limit
  if (page < 1) page = 1;

  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const cacheKey = `admin:users:p${page}:l${limit}`;

  // 2. Cache Hit Check
  const cached = serverCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return res.status(200).json(cached.data);
  }

  // 3. Stampede Protection (Promise Coalescing)
  // If a request for this exact page is already in flight, wait for it instead of hitting the DB again
  if (!pendingQueries.has(cacheKey)) {
    const queryPromise = (async () => {
      try {
        const { data, error, count } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(start, end);

        if (error) throw error;

        const responsePayload = {
          data,
          meta: { page, limit, total: count, source: 'db' }
        };

        // Cache for 60 seconds
        serverCache.set(cacheKey, {
          data: { ...responsePayload, meta: { ...responsePayload.meta, source: 'cache' } },
          expiresAt: Date.now() + 60000,
          staleData: responsePayload // Keep indefinitely as a stale fallback
        });

        return responsePayload;
      } catch (err) {
        throw err;
      } finally {
        pendingQueries.delete(cacheKey); // Cleanup
      }
    })();
    pendingQueries.set(cacheKey, queryPromise);
  }

  try {
    const result = await pendingQueries.get(cacheKey);
    res.status(200).json(result);
  } catch (error) {
    // 4. Stale Fallback Behavior
    // If the database is overwhelmed, return stale data if we have it, rather than failing
    if (cached && cached.staleData) {
      return res.status(200).json({
        ...cached.staleData,
        meta: { ...cached.staleData.meta, source: 'stale_fallback' }
      });
    }
    res.status(503).json({ error: 'Service Unavailable', message: 'Database lookup failed' });
  }
});

// Centralized Error Handling
app.use((err, req, res, next) => {
  console.error(`[Unhandled Error] ReqID: ${req.id} - ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
});

// 7. Graceful Shutdown & Server Init
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Hardened API Server running on port ${PORT}`);
});

const gracefulShutdown = () => {
  console.log('Received kill signal, shutting down gracefully.');
  server.close(() => {
    console.log('Closed out remaining connections.');
    process.exit(0);
  });
  
  // Force close after 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
