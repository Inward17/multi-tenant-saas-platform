import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    constructor(
        private repo: TasksRepository,
        private audit: AuditService,
    ) { }

    async create(dto: CreateTaskDto, organizationId: string, userId?: string) {
        const project = await this.repo.findProjectInOrg(dto.projectId, organizationId);
        if (!project) throw new NotFoundException('Project not found in your organization');

        if (dto.assignedTo) {
            const assignee = await this.repo.findUserInOrg(dto.assignedTo, organizationId);
            if (!assignee) throw new NotFoundException('Assigned user not found in your organization');
        }

        const task = await this.repo.create({
            title: dto.title,
            description: dto.description,
            status: dto.status || 'TODO',
            projectId: dto.projectId,
            assignedTo: dto.assignedTo,
            organizationId,
        });

        await this.audit.log({
            action: 'TASK_CREATED',
            entity: 'Task',
            entityId: task.id,
            userId: userId || 'system',
            organizationId,
            metadata: { title: dto.title, projectId: dto.projectId },
        });

        if (dto.assignedTo) {
            await this.audit.log({
                action: 'TASK_ASSIGNED',
                entity: 'Task',
                entityId: task.id,
                userId: userId || 'system',
                organizationId,
                metadata: { assignedTo: dto.assignedTo },
            });
        }

        return task;
    }

    async findAll(
        organizationId: string,
        query: { page?: number; limit?: number; status?: string; search?: string },
    ) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const { data, total } = await this.repo.findMany(organizationId, {
            skip,
            take: limit,
            status: query.status,
            search: query.search,
        });

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string, organizationId: string) {
        const task = await this.repo.findOne(id, organizationId);
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    async update(
        id: string,
        dto: UpdateTaskDto,
        currentUser: { userId: string; organizationId: string; role: string },
    ) {
        const task = await this.repo.findById(id, currentUser.organizationId);
        if (!task) throw new NotFoundException('Task not found');

        if (currentUser.role === 'MEMBER' && task.assignedTo !== currentUser.userId) {
            throw new ForbiddenException('You can only update tasks assigned to you');
        }

        if (dto.assignedTo) {
            const assignee = await this.repo.findUserInOrg(dto.assignedTo, currentUser.organizationId);
            if (!assignee) throw new NotFoundException('Assigned user not found in your organization');
        }

        const updated = await this.repo.update(id, dto as any);

        if (dto.assignedTo && dto.assignedTo !== task.assignedTo) {
            await this.audit.log({
                action: 'TASK_ASSIGNED',
                entity: 'Task',
                entityId: id,
                userId: currentUser.userId,
                organizationId: currentUser.organizationId,
                metadata: { assignedTo: dto.assignedTo, previousAssignee: task.assignedTo },
            });
        }

        if (dto.status && dto.status !== task.status) {
            await this.audit.log({
                action: 'TASK_STATUS_CHANGED',
                entity: 'Task',
                entityId: id,
                userId: currentUser.userId,
                organizationId: currentUser.organizationId,
                metadata: { from: task.status, to: dto.status },
            });
        }

        return updated;
    }

    async remove(id: string, organizationId: string, userId?: string) {
        const task = await this.repo.findById(id, organizationId);
        if (!task) throw new NotFoundException('Task not found');
        await this.repo.softDelete(id);

        await this.audit.log({
            action: 'TASK_DELETED',
            entity: 'Task',
            entityId: id,
            userId: userId || 'system',
            organizationId,
            metadata: { title: task.title },
        });

        return { message: 'Task deleted successfully' };
    }
}
