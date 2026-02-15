import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let prisma: {
        user: { findUnique: jest.Mock; create: jest.Mock };
        organization: { create: jest.Mock };
        $transaction: jest.Mock;
    };
    let jwtService: { sign: jest.Mock };

    beforeEach(async () => {
        prisma = {
            user: { findUnique: jest.fn(), create: jest.fn() },
            organization: { create: jest.fn() },
            $transaction: jest.fn(),
        };
        jwtService = { sign: jest.fn().mockReturnValue('mock-jwt-token') };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prisma },
                { provide: JwtService, useValue: jwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    // ─── REGISTER ────────────────────────────────────────────

    describe('register', () => {
        const dto = { organizationName: 'Acme', email: 'alice@acme.com', password: 'secret123' };

        it('should register a new user with org', async () => {
            prisma.user.findUnique.mockResolvedValue(null); // email not taken
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

            prisma.$transaction.mockImplementation(async (cb: any) => {
                const tx = {
                    organization: {
                        create: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Acme' }),
                    },
                    user: {
                        create: jest.fn().mockResolvedValue({
                            id: 'user-1',
                            email: 'alice@acme.com',
                            role: 'OWNER',
                            organizationId: 'org-1',
                        }),
                    },
                };
                return cb(tx);
            });

            const result = await service.register(dto);

            expect(result.token).toBe('mock-jwt-token');
            expect(result.user.email).toBe('alice@acme.com');
            expect(result.user.role).toBe('OWNER');
            expect(result.user.organizationName).toBe('Acme');
        });

        it('should throw ConflictException for duplicate email', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

            await expect(service.register(dto)).rejects.toThrow(ConflictException);
        });

        it('should hash password with bcrypt', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

            prisma.$transaction.mockImplementation(async (cb: any) => {
                const tx = {
                    organization: { create: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Acme' }) },
                    user: {
                        create: jest.fn().mockResolvedValue({
                            id: 'user-1', email: dto.email, role: 'OWNER', organizationId: 'org-1',
                        }),
                    },
                };
                return cb(tx);
            });

            await service.register(dto);
            expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
        });
    });

    // ─── LOGIN ───────────────────────────────────────────────

    describe('login', () => {
        const dto = { email: 'alice@acme.com', password: 'secret123' };

        it('should return token on valid credentials', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'alice@acme.com',
                password: 'hashed-pw',
                role: 'OWNER',
                organizationId: 'org-1',
                organization: { name: 'Acme' },
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login(dto);

            expect(result.token).toBe('mock-jwt-token');
            expect(result.user.email).toBe('alice@acme.com');
        });

        it('should throw UnauthorizedException for unknown email', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for wrong password', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'alice@acme.com',
                password: 'hashed-pw',
                role: 'OWNER',
                organizationId: 'org-1',
                organization: { name: 'Acme' },
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
        });
    });

    // ─── GET ME ──────────────────────────────────────────────

    describe('getMe', () => {
        it('should return user profile', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: 'alice@acme.com',
                role: 'OWNER',
                organizationId: 'org-1',
                organization: { name: 'Acme' },
            });

            const result = await service.getMe('user-1');

            expect(result.email).toBe('alice@acme.com');
            expect(result.organizationName).toBe('Acme');
        });

        it('should throw UnauthorizedException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.getMe('ghost-user')).rejects.toThrow(UnauthorizedException);
        });
    });
});
