import api from './client';

export interface AuditEntry {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    userId: string;
    organizationId: string;
    metadata: Record<string, any> | null;
    createdAt: string;
}

export interface AuditResponse {
    data: AuditEntry[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

export function getAuditLogs(page = 1, limit = 30) {
    return api<AuditResponse>(`/audit?page=${page}&limit=${limit}`);
}
