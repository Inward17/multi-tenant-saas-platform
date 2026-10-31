import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TasksRepository } from './tasks.repository';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

@Injectable()
export class TasksService {
    constructor(
        private repo: TasksRepository,
        private audit: AuditService,
        private eventsGateway: EventsGateway,
        @InjectQueue('notifications') private notificationsQueue: Queue,
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

        // Resolve performer email for audit context
        const performer = userId ? await this.repo.findUserInOrg(userId, organizationId) : null;
        const performerEmail = performer?.email || 'system';

        // Audit
        await this.audit.log({
            action: 'TASK_CREATED',
            entity: 'Task',
            entityId: task.id,
            userId: userId || 'system',
            organizationId,
            metadata: { title: dto.title, projectId: dto.projectId, performerEmail },
        });

        if (dto.assignedTo) {
            const assignee = await this.repo.findUserInOrg(dto.assignedTo, organizationId);
            await this.audit.log({
                action: 'TASK_ASSIGNED',
                entity: 'Task',
                entityId: task.id,
                userId: userId || 'system',
                organizationId,
                metadata: {
                    taskTitle: dto.title,
                    assignedTo: dto.assignedTo,
                    assigneeEmail: assignee?.email || dto.assignedTo,
                    performerEmail,
                },
            });

            // Queue async notification
            await this.notificationsQueue.add('task-assigned', {
                taskId: task.id,
                taskTitle: dto.title,
                assignedTo: dto.assignedTo,
                assignedBy: userId || 'system',
            });
        }

        // Broadcast real-time
        this.eventsGateway.broadcastTaskCreated(organizationId, task);

        return task;
    }

    async findAll(
        organizationId: string,
        query: { page?: number; limit?: number; status?: string; search?: string },
    ) {
        if (query.status && !TASK_STATUSES.includes(query.status)) {
            throw new BadRequestException(`status must be one of ${TASK_STATUSES.join(', ')}`);
        }
        const page = Math.max(Math.floor(query.page || 1), 1);
        const limit = Math.min(Math.max(Math.floor(query.limit || 10), 1), 100);
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

        if (currentUser.role === 'MEMBER') {
            if (task.assignedTo !== currentUser.userId) {
                throw new ForbiddenException('You can only update tasks assigned to you');
            }
            if (Object.entries(dto).some(([k, v]) => k !== 'status' && v !== undefined)) {
                throw new ForbiddenException('Members can only change task status');
            }
        }

        if (dto.assignedTo) {
            const assignee = await this.repo.findUserInOrg(dto.assignedTo, currentUser.organizationId);
            if (!assignee) throw new NotFoundException('Assigned user not found in your organization');
        }

        const updated = await this.repo.update(id, dto as any);

        // Audit + Queue for assignment changes
        if (dto.assignedTo && dto.assignedTo !== task.assignedTo) {
            const assignee = await this.repo.findUserInOrg(dto.assignedTo, currentUser.organizationId);
            const performer = await this.repo.findUserInOrg(currentUser.userId, currentUser.organizationId);
            const prevAssignee = task.assignedTo
                ? await this.repo.findUserInOrg(task.assignedTo, currentUser.organizationId)
                : null;

            await this.audit.log({
                action: 'TASK_ASSIGNED',
                entity: 'Task',
                entityId: id,
                userId: currentUser.userId,
                organizationId: currentUser.organizationId,
                metadata: {
                    taskTitle: updated.title,
                    assignedTo: dto.assignedTo,
                    assigneeEmail: assignee?.email || dto.assignedTo,
                    previousAssignee: task.assignedTo,
                    previousAssigneeEmail: prevAssignee?.email || null,
                    performerEmail: performer?.email || currentUser.userId,
                },
            });

            await this.notificationsQueue.add('task-assigned', {
                taskId: id,
                taskTitle: updated.title,
                assignedTo: dto.assignedTo,
                assignedBy: currentUser.userId,
            });
        }

        // Audit + Queue for status changes
        if (dto.status && dto.status !== task.status) {
            const performer = await this.repo.findUserInOrg(currentUser.userId, currentUser.organizationId);
            await this.audit.log({
                action: 'TASK_STATUS_CHANGED',
                entity: 'Task',
                entityId: id,
                userId: currentUser.userId,
                organizationId: currentUser.organizationId,
                metadata: {
                    taskTitle: updated.title,
                    from: task.status,
                    to: dto.status,
                    performerEmail: performer?.email || currentUser.userId,
                },
            });

            await this.notificationsQueue.add('task-status-changed', {
                taskId: id,
                taskTitle: updated.title,
                from: task.status,
                to: dto.status,
                changedBy: currentUser.userId,
            });
        }

        // Broadcast real-time
        this.eventsGateway.broadcastTaskUpdated(currentUser.organizationId, updated);

        return updated;
    }

    async remove(id: string, organizationId: string, userId?: string) {
        const task = await this.repo.findById(id, organizationId);
        if (!task) throw new NotFoundException('Task not found');
        await this.repo.softDelete(id);

        const performer = userId ? await this.repo.findUserInOrg(userId, organizationId) : null;

        await this.audit.log({
            action: 'TASK_DELETED',
            entity: 'Task',
            entityId: id,
            userId: userId || 'system',
            organizationId,
            metadata: { title: task.title, performerEmail: performer?.email || 'system' },
        });

        // Broadcast real-time
        this.eventsGateway.broadcastTaskDeleted(organizationId, id);

        return { message: 'Task deleted successfully' };
    }
}
