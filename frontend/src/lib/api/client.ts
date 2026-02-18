const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

interface FetchOptions {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
}

async function api<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = options;

    let url = `${API_BASE}${endpoint}`;
    if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams}`;
    }

    const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Request failed' }));
        throw { status: res.status, message: error.message || 'Request failed' };
    }

    return res.json();
}

export default api;
