import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
export declare class TasksController {
    private tasksService;
    constructor(tasksService: TasksService);
    create(dto: CreateTaskDto, organizationId: string): Promise<{
        project: {
            id: string;
            name: string;
        };
        assignee: {
            email: string;
            id: string;
        } | null;
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        title: string;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        projectId: string;
        assignedTo: string | null;
        updatedAt: Date;
    }>;
    findAll(organizationId: string, page?: string, limit?: string, status?: string): Promise<{
        data: ({
            project: {
                id: string;
                name: string;
            };
            assignee: {
                email: string;
                id: string;
            } | null;
        } & {
            id: string;
            organizationId: string;
            createdAt: Date;
            title: string;
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            projectId: string;
            assignedTo: string | null;
            updatedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, organizationId: string): Promise<{
        project: {
            id: string;
            name: string;
        };
        assignee: {
            email: string;
            id: string;
        } | null;
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        title: string;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        projectId: string;
        assignedTo: string | null;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateTaskDto, currentUser: {
        userId: string;
        organizationId: string;
        role: string;
    }): Promise<{
        project: {
            id: string;
            name: string;
        };
        assignee: {
            email: string;
            id: string;
        } | null;
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        title: string;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        projectId: string;
        assignedTo: string | null;
        updatedAt: Date;
    }>;
    remove(id: string, organizationId: string): Promise<{
        message: string;
    }>;
}
