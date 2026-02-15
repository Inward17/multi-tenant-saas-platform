import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private audit: AuditService,
    ) { }

    async findAll(organizationId: string) {
        return this.prisma.user.findMany({
            where: { organizationId },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                organizationId: true,
            },
        });
    }

    async updateRole(
        userId: string,
        dto: UpdateRoleDto,
        currentUser: { userId: string; organizationId: string; role: string },
    ) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        if (targetUser.organizationId !== currentUser.organizationId) {
            throw new ForbiddenException('User does not belong to your organization');
        }

        if (targetUser.id === currentUser.userId) {
            throw new ForbiddenException('Cannot change your own role');
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { role: dto.role as any },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                organizationId: true,
            },
        });

        await this.audit.log({
            action: 'ROLE_CHANGED',
            entity: 'User',
            entityId: userId,
            userId: currentUser.userId,
            organizationId: currentUser.organizationId,
            metadata: { from: targetUser.role, to: dto.role, targetEmail: targetUser.email },
        });

        return updated;
    }
}
