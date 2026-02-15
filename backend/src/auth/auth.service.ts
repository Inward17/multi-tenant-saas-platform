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

        const hashedPassword = await bcrypt.hash(dto.password, 10);

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

        const token = this.signToken(result.user.id, result.organization.id, result.user.role);

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

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.signToken(user.id, user.organizationId, user.role);

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

    private signToken(userId: string, organizationId: string, role: string): string {
        return this.jwtService.sign({ userId, organizationId, role });
    }
}
