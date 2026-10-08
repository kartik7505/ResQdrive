import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// -----------------------------------------------------------------------------
// METRICS & THRESHOLDS
// -----------------------------------------------------------------------------
const telemetryLatency = new Trend('telemetry_duration');
const dispatchLatency = new Trend('dispatch_duration');
const errorRate = new Rate('error_rate');

// 100,000 simultaneous users does NOT mean 100,000 requests per second.
// With an average think time/telemetry ping of 10s, 100k users = ~10k RPS.
const TEST_TYPE = __ENV.TEST_TYPE || 'smoke';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'http://localhost:54321'; // Default local supabase
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';
const BACKEND_URL = __ENV.BACKEND_URL || 'http://localhost:3001';

const testOptions = {
  smoke: {
    vus: 1,
    duration: '1m',
    thresholds: {
      http_req_duration: ['p(95)<500'],
      error_rate: ['rate<0.01'],
    },
  },
  load: { // Normal Load (e.g. 5,000 Concurrent Users)
    stages: [
      { duration: '2m', target: 1000 },
      { duration: '5m', target: 5000 },
      { duration: '2m', target: 0 },
    ],
    thresholds: {
      'telemetry_duration': ['p(95)<800'],
      'dispatch_duration': ['p(95)<1500'],
      'error_rate': ['rate<0.05'], // Max 5% failure rate under high load
    },
  },
  stress: { // Stress Test (e.g. 20,000 Concurrent Users)
    stages: [
      { duration: '5m', target: 5000 },
      { duration: '10m', target: 20000 },
      { duration: '5m', target: 0 },
    ],
    thresholds: {
      'error_rate': ['rate<0.10'],
    }
  },
  spike: { // Spike Test (Sudden influx of users, e.g. marketing push)
    stages: [
      { duration: '10s', target: 500 },
      { duration: '30s', target: 15000 },
      { duration: '2m', target: 15000 },
      { duration: '30s', target: 0 },
    ],
  },
  soak: { // Soak test (Finding memory leaks over 4 hours at normal load)
    stages: [
      { duration: '5m', target: 2000 },
      { duration: '4h', target: 2000 },
      { duration: '5m', target: 0 },
    ],
  }
};

export const options = testOptions[TEST_TYPE];

// -----------------------------------------------------------------------------
// SETUP (Provisioning Test Users)
// -----------------------------------------------------------------------------
// In a real load test, we use pre-provisioned synthetic accounts to avoid hitting
// Supabase Auth rate limits (30 emails/hr) during the test setup.
export function setup() {
  return {
    testUserEmail: `testuser_${Math.floor(Math.random() * 10000)}@resqdrive.loadtest`,
    testPassword: 'loadtestpassword123'
  };
}

// -----------------------------------------------------------------------------
// USER JOURNEY (Virtual User Execution)
// -----------------------------------------------------------------------------
export default function (data) {
  const supabaseHeaders = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  let token = '';
  let userId = '';

  group('1. Authentication (Login)', () => {
    const loginRes = http.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, 
      JSON.stringify({ email: data.testUserEmail, password: data.testPassword }), 
      { headers: supabaseHeaders }
    );
    
    // Check if login is successful or if we hit provider rate limits
    const success = check(loginRes, {
      'logged in successfully': (r) => r.status === 200,
    });
    
    if (success) {
      token = loginRes.json('access_token');
      userId = loginRes.json('user.id');
    } else {
      errorRate.add(1);
    }
    
    sleep(Math.random() * 2 + 1); // Realistic think time (1-3 seconds)
  });

  // Proceed only if authenticated
  if (token && userId) {
    const authHeaders = {
      ...supabaseHeaders,
      'Authorization': `Bearer ${token}`
    };

    group('2. Background Telemetry (Simulating active drive)', () => {
      // Simulate the app pushing telemetry coordinates every 10 seconds
      for (let i = 0; i < 3; i++) {
        const telemetryRes = http.post(`${SUPABASE_URL}/rest/v1/activity_events`, 
          JSON.stringify({
            user_id: userId,
            event_type: 'telemetry_ping',
            path: '/drive',
            metadata: { lat: 29.2183, lng: 79.5126, speed: 65 }
          }), 
          { headers: authHeaders }
        );
        
        telemetryLatency.add(telemetryRes.timings.duration);
        
        check(telemetryRes, {
          'telemetry stored': (r) => r.status === 201,
        }) || errorRate.add(1);

        sleep(10); // Sleep 10s to simulate the actual polling interval, avoiding artificial RPS bloat.
      }
    });

    group('3. Emergency Dispatch (High-priority write)', () => {
      // User clicks "Send Help"
      const dispatchRes = http.post(`${BACKEND_URL}/api/emergency/dispatch`, 
        JSON.stringify({
          lat: 29.2183,
          lng: 79.5126,
          severity: 'high',
          idempotency_key: `uuid-${__VU}-${__ITER}`
        }), 
        { headers: authHeaders }
      );
      
      dispatchLatency.add(dispatchRes.timings.duration);
      
      check(dispatchRes, {
        'dispatch succeeded': (r) => r.status === 200,
        'dispatch rate limited': (r) => r.status === 429, // Track WAF/Rate limit triggers
      }) || errorRate.add(1);
      
      sleep(5);
    });
  }
}
