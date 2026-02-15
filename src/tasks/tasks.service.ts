import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    async create(
        dto: CreateTaskDto,
        organizationId: string,
    ) {
        // Verify project belongs to this organization
        const project = await this.prisma.project.findFirst({
            where: { id: dto.projectId, organizationId },
        });
        if (!project) {
            throw new NotFoundException('Project not found in your organization');
        }

        // Verify assignee belongs to same organization (if provided)
        if (dto.assignedTo) {
            const assignee = await this.prisma.user.findFirst({
                where: { id: dto.assignedTo, organizationId },
            });
            if (!assignee) {
                throw new NotFoundException('Assigned user not found in your organization');
            }
        }

        return this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                status: dto.status || 'TODO',
                projectId: dto.projectId,
                assignedTo: dto.assignedTo,
                organizationId,
            },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, email: true } },
            },
        });
    }

    async findAll(
        organizationId: string,
        query: { page?: number; limit?: number; status?: string },
    ) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = { organizationId };
        if (query.status) {
            where.status = query.status;
        }

        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip,
                take: limit,
                include: {
                    project: { select: { id: true, name: true } },
                    assignee: { select: { id: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.task.count({ where }),
        ]);

        return {
            data: tasks,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, organizationId: string) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, email: true } },
            },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }
        return task;
    }

    async update(
        id: string,
        dto: UpdateTaskDto,
        currentUser: { userId: string; organizationId: string; role: string },
    ) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId: currentUser.organizationId },
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        // MEMBER can only update tasks assigned to them
        if (currentUser.role === 'MEMBER' && task.assignedTo !== currentUser.userId) {
            throw new ForbiddenException('You can only update tasks assigned to you');
        }

        // Verify new assignee belongs to same org (if changing assignment)
        if (dto.assignedTo) {
            const assignee = await this.prisma.user.findFirst({
                where: { id: dto.assignedTo, organizationId: currentUser.organizationId },
            });
            if (!assignee) {
                throw new NotFoundException('Assigned user not found in your organization');
            }
        }

        return this.prisma.task.update({
            where: { id },
            data: dto,
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, email: true } },
            },
        });
    }

    async remove(id: string, organizationId: string) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        await this.prisma.task.delete({ where: { id } });
        return { message: 'Task deleted successfully' };
    }
}
