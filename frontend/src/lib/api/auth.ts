import api from './client';

export interface User {
    id: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    organizationId: string;
    organizationName: string;
}

export interface AuthResponse {
    user: User;
}

export function register(data: { organizationName: string; email: string; password: string }) {
    return api<AuthResponse>('/auth/register', { method: 'POST', body: data });
}

export function login(data: { email: string; password: string }) {
    return api<AuthResponse>('/auth/login', { method: 'POST', body: data });
}

export function getMe() {
    return api<User>('/auth/me');
}

export function logout() {
    return api<{ message: string }>('/auth/logout', { method: 'POST' });
}
