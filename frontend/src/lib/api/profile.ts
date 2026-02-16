import api from './client';

export interface UserProfile {
    id: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    createdAt: string;
    organizationId: string;
    organizationName: string;
}

export function getProfile() {
    return api<UserProfile>('/users/me');
}

export function updateProfile(data: { email?: string }) {
    return api<UserProfile>('/users/me', { method: 'PATCH', body: data });
}

export function changePassword(data: { currentPassword: string; newPassword: string }) {
    return api<{ message: string }>('/users/me/password', { method: 'PATCH', body: data });
}
