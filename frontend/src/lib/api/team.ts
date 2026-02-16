import api from './client';

export interface TeamMember {
    id: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    createdAt: string;
    organizationId: string;
}

export function getTeamMembers() {
    return api<TeamMember[]>('/users');
}

export function inviteMember(data: { email: string; password: string; role?: string }) {
    return api<TeamMember>('/users/invite', { method: 'POST', body: data });
}

export function updateMemberRole(userId: string, role: string) {
    return api<TeamMember>(`/users/${userId}/role`, { method: 'PATCH', body: { role } });
}
