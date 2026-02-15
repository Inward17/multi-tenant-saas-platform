import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
    constructor(private prisma: PrismaService) { }

    async findOne(organizationId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                _count: {
                    select: { users: true, projects: true, tasks: true },
                },
            },
        });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }
        return org;
    }

    async update(organizationId: string, dto: UpdateOrganizationDto) {
        try {
            return await this.prisma.organization.update({
                where: { id: organizationId },
                data: dto,
            });
        } catch {
            throw new NotFoundException('Organization not found');
        }
    }

    async remove(organizationId: string) {
        try {
            await this.prisma.organization.delete({
                where: { id: organizationId },
            });
            return { message: 'Organization deleted successfully' };
        } catch {
            throw new NotFoundException('Organization not found');
        }
    }
}
