// RIHAISH Central API Client Service — Production Grade
// All requests route through backend API with JWT auth headers.
// No mock data fallbacks — all data comes from the live backend.

const API_BASE = '/api';

// ─── Auth Token Management ───
function getToken() {
  try {
    const auth = localStorage.getItem('rihaish_token');
    return auth || null;
  } catch {
    return null;
  }
}

function getAuthHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    if (res.status === 401) {
      localStorage.removeItem('rihaish_token');
      localStorage.removeItem('rihaish_user');
      window.dispatchEvent(new CustomEvent('rihaish:auth-expired'));
      throw new Error(err.detail || 'Session expired. Please login again.');
    }
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// ─── Auth Endpoints ───
export async function sendSignupOtp(userData) {
  const res = await fetch(`${API_BASE}/auth/send-signup-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return handleResponse(res);
}

export async function verifyOtpAndRegister(verificationData) {
  const res = await fetch(`${API_BASE}/auth/verify-otp-and-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verificationData)
  });
  return handleResponse(res);
}

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return handleResponse(res);
}

// ─── Password Recovery ───
export async function forgotPassword(email) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return handleResponse(res);
}

export async function resetPassword(email, otpCode, newPassword) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword })
  });
  return handleResponse(res);
}

export async function fetchUserProfile() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ─── Properties ───
export async function fetchProperties(filters = {}) {
  const params = new URLSearchParams();
  if (filters.city && filters.city !== 'all') params.append('city', filters.city);
  if (filters.society && filters.society !== 'all') params.append('society', filters.society);
  if (filters.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters.maxPrice) params.append('max_price', filters.maxPrice);
  if (filters.verifiedOnly) params.append('verified_only', 'true');
  if (filters.minAiScore) params.append('min_ai_score', filters.minAiScore);

  const res = await fetch(`${API_BASE}/properties/?${params.toString()}`);
  const data = await handleResponse(res);
  // Normalize: backend returns { count, results }, frontend expects { properties }
  return { properties: data.results || data.properties || [], count: data.count || 0 };
}

export async function fetchPropertyById(id) {
  const res = await fetch(`${API_BASE}/properties/${id}`);
  const data = await handleResponse(res);
  return data.property;
}

// ─── Watchlist (JWT-protected) ───
export async function fetchWatchlist() {
  const res = await fetch(`${API_BASE}/watchlist/`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function fetchWatchlistFull() {
  const res = await fetch(`${API_BASE}/watchlist/full`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function toggleWatchlistAPI(propertyId, city) {
  const res = await fetch(`${API_BASE}/watchlist/toggle`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ property_id: propertyId, city })
  });
  return handleResponse(res);
}

// ─── Inquiry ───
export async function submitDirectInquiry(inquiryData) {
  const res = await fetch(`${API_BASE}/inquiry/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inquiryData)
  });
  return handleResponse(res);
}

// ─── Subscription & Billing ───
export async function fetchSubscriptionPlans() {
  const res = await fetch(`${API_BASE}/subscription/plans`);
  return handleResponse(res);
}

export async function processCheckout(checkoutData) {
  const res = await fetch(`${API_BASE}/subscription/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(checkoutData)
  });
  return handleResponse(res);
}

export async function subscribeNewsletter(email) {
  const res = await fetch(`${API_BASE}/subscription/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return handleResponse(res);
}

// ─── AI & Predictions ───
export async function fetchPropertyPrediction(propertyId) {
  const res = await fetch(`${API_BASE}/predict/property/${propertyId}`);
  return handleResponse(res);
}

export async function fetchMarketTrend(city) {
  const res = await fetch(`${API_BASE}/predict/market-trend/${city}`);
  return handleResponse(res);
}

export async function fetchSocietyComparison() {
  const res = await fetch(`${API_BASE}/predict/society-comparison`);
  return handleResponse(res);
}

// ─── Construction Progress ───
export async function fetchPropertyProgress(propertyId) {
  const res = await fetch(`${API_BASE}/progress/${propertyId}`);
  return handleResponse(res);
}

// ─── Society Admin ───
export async function fetchSocietySubscription() {
  const res = await fetch(`${API_BASE}/society/subscription`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function fetchSocietyListings() {
  const res = await fetch(`${API_BASE}/society/listings`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function fetchSocietyLeads() {
  const res = await fetch(`${API_BASE}/society/leads`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ─── Admin Endpoints ───
export async function fetchShardsStatus() {
  const res = await fetch(`${API_BASE}/admin/shards`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function triggerPhysicalFailover(shardId) {
  const res = await fetch(`${API_BASE}/admin/shards/${shardId}/failover`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

export async function fetchAdminMetrics() {
  const res = await fetch(`${API_BASE}/admin/metrics`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function fetchEmailLogs() {
  const res = await fetch(`${API_BASE}/admin/email-logs`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function fetchSystemHealth() {
  const res = await fetch(`${API_BASE}/admin/system-health`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function fetchShardWalLog(shardId) {
  const res = await fetch(`${API_BASE}/admin/shards/${shardId}/wal-log`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function syncAllShards() {
  const res = await fetch(`${API_BASE}/admin/shards/sync-all`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

// ─── Admin: Data Pipeline & AI ───
export async function fetchPipelineStatus() {
  const res = await fetch(`${API_BASE}/admin/pipeline/status`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function triggerPipelineManually() {
  const res = await fetch(`${API_BASE}/admin/pipeline/trigger`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

export async function fetchAICalibration() {
  const res = await fetch(`${API_BASE}/admin/ai/calibration`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function fetchMarketTrends() {
  const res = await fetch(`${API_BASE}/admin/market-trends`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
