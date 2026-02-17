import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(
        private prisma: PrismaService,
        private audit: AuditService,
    ) { }

    async create(dto: CreateProjectDto, organizationId: string, userId?: string) {
        const project = await this.prisma.project.create({
            data: { name: dto.name, organizationId },
        });

        const performer = userId
            ? await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
            : null;

        await this.audit.log({
            action: 'PROJECT_CREATED',
            entity: 'Project',
            entityId: project.id,
            userId: userId || 'system',
            organizationId,
            metadata: { name: dto.name, performerEmail: performer?.email || 'system' },
        });

        return project;
    }

    async findAll(organizationId: string) {
        return this.prisma.project.findMany({
            where: { organizationId, deletedAt: null } as any,
            include: { _count: { select: { tasks: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, organizationId: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId, deletedAt: null } as any,
            include: {
                tasks: {
                    where: { deletedAt: null } as any,
                    include: {
                        assignee: { select: { id: true, email: true } },
                        project: { select: { id: true, name: true } },
                    },
                },
                _count: { select: { tasks: true } },
            },
        });
        if (!project) throw new NotFoundException('Project not found');
        return project;
    }

    async update(id: string, dto: UpdateProjectDto, organizationId: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId, deletedAt: null } as any,
        });
        if (!project) throw new NotFoundException('Project not found');
        return this.prisma.project.update({ where: { id }, data: dto });
    }

    async remove(id: string, organizationId: string, userId?: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId, deletedAt: null } as any,
        });
        if (!project) throw new NotFoundException('Project not found');

        await this.prisma.project.update({
            where: { id },
            data: { deletedAt: new Date() } as any,
        });

        const performer = userId
            ? await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
            : null;

        await this.audit.log({
            action: 'PROJECT_DELETED',
            entity: 'Project',
            entityId: id,
            userId: userId || 'system',
            organizationId,
            metadata: { name: project.name, performerEmail: performer?.email || 'system' },
        });

        return { message: 'Project deleted successfully' };
    }
}
