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
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create organization and owner user in a transaction
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

        // Generate JWT
        const payload = {
            userId: result.user.id,
            organizationId: result.organization.id,
            role: result.user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
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
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { organization: true },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT
        const payload = {
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                organizationName: user.organization.name,
            },
        };
    }
}
