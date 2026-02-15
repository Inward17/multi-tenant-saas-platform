import api from './client';

export interface OrgUser {
    id: string;
    email: string;
    role: string;
}

export function getUsers() {
    return api<OrgUser[]>('/users');
}
