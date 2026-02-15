import api from './client';

export interface Project {
    id: string;
    name: string;
    organizationId: string;
    createdAt: string;
    _count: { tasks: number };
}

export interface ProjectDetail extends Project {
    tasks: Array<{
        id: string;
        title: string;
        status: string;
        assignee: { id: string; email: string } | null;
    }>;
}

export function getProjects() {
    return api<Project[]>('/projects');
}

export function getProject(id: string) {
    return api<ProjectDetail>(`/projects/${id}`);
}

export function createProject(data: { name: string }) {
    return api<Project>('/projects', { method: 'POST', body: data });
}

export function updateProject(id: string, data: { name: string }) {
    return api<Project>(`/projects/${id}`, { method: 'PATCH', body: data });
}

export function deleteProject(id: string) {
    return api<{ message: string }>(`/projects/${id}`, { method: 'DELETE' });
}
