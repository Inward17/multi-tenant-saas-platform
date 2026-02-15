import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateProjectDto, organizationId: string) {
        return this.prisma.project.create({
            data: { name: dto.name, organizationId },
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.project.findMany({
            where: { organizationId },
            include: { _count: { select: { tasks: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, organizationId: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId },
            include: { tasks: true, _count: { select: { tasks: true } } },
        });
        if (!project) throw new NotFoundException('Project not found');
        return project;
    }

    async update(id: string, dto: UpdateProjectDto, organizationId: string) {
        const project = await this.prisma.project.findFirst({ where: { id, organizationId } });
        if (!project) throw new NotFoundException('Project not found');
        return this.prisma.project.update({ where: { id }, data: dto });
    }

    async remove(id: string, organizationId: string) {
        const project = await this.prisma.project.findFirst({ where: { id, organizationId } });
        if (!project) throw new NotFoundException('Project not found');
        await this.prisma.project.delete({ where: { id } });
        return { message: 'Project deleted successfully' };
    }
}
