import api from './client';

export interface Organization {
    id: string;
    name: string;
    createdAt: string;
    _count: { users: number; projects: number; tasks: number };
}

export function getOrganization() {
    return api<Organization>('/organizations');
}

export function updateOrganization(data: { name: string }) {
    return api<Organization>('/organizations', { method: 'PATCH', body: data });
}

export function deleteOrganization() {
    return api<{ message: string }>('/organizations', { method: 'DELETE' });
}
