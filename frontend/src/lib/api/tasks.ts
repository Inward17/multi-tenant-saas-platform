import api from './client';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    projectId: string;
    assignedTo: string | null;
    organizationId: string;
    createdAt: string;
    project: { id: string; name: string };
    assignee: { id: string; email: string } | null;
}

export interface TasksResponse {
    data: Task[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

export function getTasks(params?: { page?: string; limit?: string; status?: string }) {
    const filteredParams: Record<string, string> = {};
    if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v) filteredParams[k] = v; });
    }
    return api<TasksResponse>('/tasks', { params: Object.keys(filteredParams).length ? filteredParams : undefined });
}

export function getTask(id: string) {
    return api<Task>(`/tasks/${id}`);
}

export function createTask(data: {
    title: string;
    description?: string;
    status?: string;
    projectId: string;
    assignedTo?: string;
}) {
    return api<Task>('/tasks', { method: 'POST', body: data });
}

export function updateTask(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    assignedTo?: string;
}) {
    return api<Task>(`/tasks/${id}`, { method: 'PATCH', body: data });
}

export function deleteTask(id: string) {
    return api<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' });
}
