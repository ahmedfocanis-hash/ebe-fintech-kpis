const API_BASE = '/api';

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('fintech_kpi_token');
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
  return res.json();
}

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return res.json();
}

export async function fetchTaxonomy() {
  const res = await fetch(`${API_BASE}/taxonomy`);
  return res.json();
}

export async function fetchScorecards(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/scorecards?${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function fetchScorecardById(id) {
  const res = await fetch(`${API_BASE}/scorecards/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function fetchScorecardByUserId(userId) {
  const res = await fetch(`${API_BASE}/scorecards/user/${userId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function saveSelfRatings(scorecardId, items) {
  const res = await fetch(`${API_BASE}/scorecards/${scorecardId}/self-ratings`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ items }),
  });
  return res.json();
}

export async function submitScorecard(scorecardId, data) {
  const res = await fetch(`${API_BASE}/scorecards/${scorecardId}/submit`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function saveManagerReview(scorecardId, data) {
  const res = await fetch(`${API_BASE}/scorecards/${scorecardId}/manager-review`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function finalizeReview(scorecardId, data) {
  const res = await fetch(`${API_BASE}/scorecards/${scorecardId}/finalize`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function postAuditComment(scorecardId, data) {
  const res = await fetch(`${API_BASE}/scorecards/${scorecardId}/audit-comment`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function saveAuditorReview(scorecardId, data) {
  const res = await fetch(`${API_BASE}/scorecards/${scorecardId}/auditor-review`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchLeaderboard() {
  const res = await fetch(`${API_BASE}/analytics/leaderboard`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function fetchAuditFeed() {
  const res = await fetch(`${API_BASE}/audit-feed`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function resetDatabase() {
  const res = await fetch(`${API_BASE}/seed/reset`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
  });
  return res.json();
}
