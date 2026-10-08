import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getSessionId = () => {
  let id = sessionStorage.getItem('resqdrive_session');
  if (!id) {
    id = Math.random().toString(36).substring(2);
    sessionStorage.setItem('resqdrive_session', id);
  }
  return id;
};

const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform
  };
};

// --- AUTH ---
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    // Log failed attempt
    const { userAgent } = getDeviceInfo();
    // We can't log user_id easily if auth failed, but we record the attempt
    await supabase.from('auth_events').insert([
      { event_type: 'login_failed', user_agent: userAgent }
    ]);
    throw error;
  }

  // Update last login
  await supabase.from('profiles').update({ last_login: new Date() }).eq('id', data.user.id);
  
  // Log success
  const { userAgent } = getDeviceInfo();
  await supabase.from('auth_events').insert([
    { user_id: data.user.id, event_type: 'login_success', user_agent: userAgent }
  ]);

  // Fetch profile to get role
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  
  return { token: data.session.access_token, user: { ...data.user, ...profile } };
};

export const register = async (email, password, displayName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });

  if (error) throw error;
  
  if (data.user) {
    const { userAgent } = getDeviceInfo();
    await supabase.from('auth_events').insert([
      { user_id: data.user.id, event_type: 'register', user_agent: userAgent }
    ]);
  }

  return { message: 'Registered successfully', user: data.user };
};

export const logout = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { userAgent } = getDeviceInfo();
    await supabase.from('auth_events').insert([
      { user_id: session.user.id, event_type: 'logout', user_agent: userAgent }
    ]);
  }
  return supabase.auth.signOut();
};

export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
};

export const updatePassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

export const setupSessionRenewal = (callback) => {
  // Supabase automatically handles token refresh in the background.
  // We expose this listener for UI updates (e.g. logging user out if session expires).
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Session token renewed automatically.');
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('resqdrive_token');
    }
    callback(event, session);
  });
};

export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
  return { ...session.user, ...profile };
};


// --- TRACKING ---
export const trackEvent = async (eventType, path, metadata = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  // Fire and forget
  supabase.from('activity_events').insert([{
    user_id: session?.user?.id || null,
    session_id: getSessionId(),
    event_type: eventType,
    path,
    metadata
  }]).then(() => {}).catch(console.error);
};

export const trackError = async (category, message, stack, path) => {
  const { data: { session } } = await supabase.auth.getSession();
  const { userAgent, platform } = getDeviceInfo();

  // Fire and forget
  supabase.from('errors').insert([{
    user_id: session?.user?.id || null,
    session_id: getSessionId(),
    category,
    message,
    stack_trace: stack,
    path,
    app_version: '1.0.0',
    browser: userAgent,
    os: platform
  }]).then(() => {}).catch(console.error);
};


// --- ADMIN ---
export const getAdminOverview = async () => {
  // Supabase JS doesn't have aggregate functions directly in select for multiple tables easily.
  // We'll perform separate lightweight count queries.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: newMembers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString());
  const { count: activeUsers } = await supabase.from('activity_events').select('user_id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()).not('user_id', 'is', null);
  const { count: logins } = await supabase.from('auth_events').select('*', { count: 'exact', head: true }).eq('event_type', 'login_success').gte('created_at', thirtyDaysAgo.toISOString());
  const { count: errors } = await supabase.from('errors').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString());

  return {
    totalUsers: totalUsers || 0,
    newMembersLast7Days: newMembers || 0,
    activeUsers30Days: activeUsers || 0, // Note: This isn't distinct users, just a raw count for now without a complex RPC.
    logins30Days: logins || 0,
    errors30Days: errors || 0
  };
};

export const checkSystemHealth = async () => {
  try {
    const start = performance.now();
    // Simulate hitting the hardened backend /readiness endpoint 
    // Since we are using Supabase directly right now, we can check a fast query.
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const latency = performance.now() - start;
    
    // Check background jobs via rpc if exposed, or mock status based on db response
    return {
      apiStatus: 'Operational',
      dbStatus: error ? 'Degraded' : 'Operational',
      latency: Math.round(latency) + 'ms',
      jobsStatus: 'Operational'
    };
  } catch (err) {
    return {
      apiStatus: 'Degraded',
      dbStatus: 'Failing',
      latency: 'Timeout',
      jobsStatus: 'Unknown'
    };
  }
};

export const getAdminUsers = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) throw error;
  
  return data.map(u => ({
    ...u,
    is_new: new Date(u.created_at) >= sevenDaysAgo
  }));
};

export const getAdminLoginHistory = async () => {
  const { data, error } = await supabase
    .from('auth_events')
    .select('*, profiles(email, display_name)')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) throw error;
  
  return data.map(d => ({
    ...d,
    email: d.profiles?.email,
    display_name: d.profiles?.display_name
  }));
};

export const getAdminErrors = async () => {
  const { data, error } = await supabase
    .from('errors')
    .select('*, profiles(email, display_name)')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) throw error;
  
  return data.map(d => ({
    ...d,
    email: d.profiles?.email,
    display_name: d.profiles?.display_name
  }));
};

export const getAdminActivity = async () => {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*, profiles(email, display_name)')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) throw error;
  
  return data.map(d => ({
    ...d,
    email: d.profiles?.email,
    display_name: d.profiles?.display_name
  }));
};
