import { env } from '$env/dynamic/public';

// VITE_API_BASE is the build-time name existing deployments (Vercel) already set
export const API_BASE = env.PUBLIC_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:3000';

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

    // X-Requested-With is required by the API's CSRF check on non-GET requests
    const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' };
    if (body) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, {
        method,
        headers,
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
