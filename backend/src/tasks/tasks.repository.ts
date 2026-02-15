import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TASK_INCLUDE = {
    project: { select: { id: true, name: true } },
    assignee: { select: { id: true, email: true } },
} as const;

@Injectable()
export class TasksRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        title: string;
        description?: string;
        status: string;
        projectId: string;
        assignedTo?: string;
        organizationId: string;
    }) {
        return this.prisma.task.create({
            data: data as any,
            include: TASK_INCLUDE,
        });
    }

    async findMany(
        organizationId: string,
        opts: { skip: number; take: number; status?: string; search?: string },
    ) {
        const where: any = { organizationId, deletedAt: null as any };
        if (opts.status) where.status = opts.status;
        if (opts.search) {
            where.OR = [
                { title: { contains: opts.search, mode: 'insensitive' } },
                { description: { contains: opts.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip: opts.skip,
                take: opts.take,
                include: TASK_INCLUDE,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.task.count({ where }),
        ]);

        return { data, total };
    }

    async findOne(id: string, organizationId: string) {
        return this.prisma.task.findFirst({
            where: { id, organizationId, deletedAt: null } as any,
            include: TASK_INCLUDE,
        });
    }

    async findById(id: string, organizationId: string) {
        return this.prisma.task.findFirst({
            where: { id, organizationId },
        });
    }

    async update(id: string, data: any) {
        return this.prisma.task.update({
            where: { id },
            data,
            include: TASK_INCLUDE,
        });
    }

    async softDelete(id: string) {
        return this.prisma.task.update({
            where: { id },
            data: { deletedAt: new Date() } as any,
        });
    }

    async restore(id: string) {
        return this.prisma.task.update({
            where: { id },
            data: { deletedAt: null } as any,
            include: TASK_INCLUDE,
        });
    }

    async findProjectInOrg(projectId: string, organizationId: string) {
        return this.prisma.project.findFirst({
            where: { id: projectId, organizationId },
        });
    }

    async findUserInOrg(userId: string, organizationId: string) {
        return this.prisma.user.findFirst({
            where: { id: userId, organizationId },
        });
    }
}
