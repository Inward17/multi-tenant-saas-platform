import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
    userId: string;
    organizationId: string;
    role: string;
    tv: number;
}

// Compared against when the email is unknown, so response time doesn't reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 12);

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 12);

        const result = await this.prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: { name: dto.organizationName },
            });

            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    role: 'OWNER',
                    organizationId: organization.id,
                },
            });

            return { user, organization };
        });

        const token = this.signToken(result.user);

        return {
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role,
                organizationId: result.organization.id,
                organizationName: result.organization.name,
            },
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { organization: true },
        });

        const passwordMatch = await bcrypt.compare(dto.password, user?.password ?? DUMMY_HASH);
        if (!user || !passwordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.signToken(user);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                organizationName: user.organization.name,
            },
        };
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { organization: true },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
        };
    }

    async validateSession(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, organizationId: true, role: true, tokenVersion: true },
        });
        if (!user || user.tokenVersion !== payload.tv) return null;
        return { userId: user.id, organizationId: user.organizationId, role: user.role };
    }

    // Bumping tokenVersion invalidates every token issued to this user
    async revokeSessions(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
        });
    }

    private signToken(user: { id: string; organizationId: string; role: string; tokenVersion: number }): string {
        const payload: JwtPayload = {
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            tv: user.tokenVersion,
        };
        return this.jwtService.sign(payload);
    }
}
