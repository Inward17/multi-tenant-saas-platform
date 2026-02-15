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
