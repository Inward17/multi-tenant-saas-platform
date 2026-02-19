import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddMemberDto } from './dto/add-member.dto';
import * as bcrypt from 'bcrypt';

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

    async addMember(dto: AddMemberDto, currentUser: { userId: string; organizationId: string }) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const role = dto.role || 'MEMBER';

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: role as any,
                organizationId: currentUser.organizationId,
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                organizationId: true,
            },
        });

        const performer = await this.prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { email: true },
        });

        await this.audit.log({
            action: 'MEMBER_ADDED',
            entity: 'User',
            entityId: user.id,
            userId: currentUser.userId,
            organizationId: currentUser.organizationId,
            metadata: { email: dto.email, role, performerEmail: performer?.email || currentUser.userId },
        });

        return user;
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                organizationId: true,
                organization: { select: { name: true } },
            },
        });
        if (!user) throw new NotFoundException('User not found');

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
        };
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        if (dto.email) {
            const existing = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existing && existing.id !== userId) {
                throw new ConflictException('Email already in use');
            }
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { ...(dto.email && { email: dto.email }) },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                organizationId: true,
                organization: { select: { name: true } },
            },
        });

        return {
            id: updated.id,
            email: updated.email,
            role: updated.role,
            createdAt: updated.createdAt,
            organizationId: updated.organizationId,
            organizationName: updated.organization.name,
        };
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) throw new NotFoundException('User not found');

        const valid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!valid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        await this.audit.log({
            action: 'PASSWORD_CHANGED',
            entity: 'User',
            entityId: userId,
            userId,
            organizationId: user.organizationId,
        });

        return { message: 'Password changed successfully' };
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

        const performer = await this.prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { email: true },
        });

        await this.audit.log({
            action: 'ROLE_CHANGED',
            entity: 'User',
            entityId: userId,
            userId: currentUser.userId,
            organizationId: currentUser.organizationId,
            metadata: {
                from: targetUser.role,
                to: dto.role,
                targetEmail: targetUser.email,
                performerEmail: performer?.email || currentUser.userId,
            },
        });

        return updated;
    }
}
