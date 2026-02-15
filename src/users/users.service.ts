import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

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
        // Find the target user
        const targetUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        // Ensure target user belongs to the same organization
        if (targetUser.organizationId !== currentUser.organizationId) {
            throw new ForbiddenException('User does not belong to your organization');
        }

        // Cannot change own role
        if (targetUser.id === currentUser.userId) {
            throw new ForbiddenException('Cannot change your own role');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { role: dto.role },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                organizationId: true,
            },
        });
    }
}
