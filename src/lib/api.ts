const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    ...(fetchOpts.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData
  if (!(fetchOpts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (stored) headers['Authorization'] = `Bearer ${stored}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOpts,
    headers,
  });

  if (res.status === 401) {
    // Try to refresh the token before giving up
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (refreshToken && !endpoint.includes('/auth/refresh')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem('token', refreshData.token);
          // Retry the original request with the new token
          headers['Authorization'] = `Bearer ${refreshData.token}`;
          const retryRes = await fetch(`${API_BASE}${endpoint}`, { ...fetchOpts, headers });
          if (retryRes.ok) {
            const ct = retryRes.headers.get('content-type') || '';
            if (ct.includes('application/pdf') || ct.includes('spreadsheetml') || ct.includes('octet-stream')) return retryRes.blob();
            return retryRes.json();
          }
        }
      } catch {}
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  // Handle file downloads
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || contentType.includes('spreadsheetml') || contentType.includes('octet-stream')) {
    return res.blob();
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (endpoint: string) => fetchApi(endpoint),
  post: (endpoint: string, body?: any) =>
    fetchApi(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (endpoint: string, body?: any) =>
    fetchApi(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (endpoint: string) => fetchApi(endpoint, { method: 'DELETE' }),
};

export default api;
