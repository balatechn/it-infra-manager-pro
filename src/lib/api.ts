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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
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
