import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: { getAllAndOverride: jest.Mock };

    beforeEach(() => {
        reflector = { getAllAndOverride: jest.fn() };
        guard = new RolesGuard(reflector as unknown as Reflector);
    });

    function mockContext(user: any): ExecutionContext {
        return {
            switchToHttp: () => ({
                getRequest: () => ({ user }),
            }),
            getHandler: () => jest.fn(),
            getClass: () => jest.fn(),
        } as unknown as ExecutionContext;
    }

    it('should allow access when no roles metadata is set', () => {
        reflector.getAllAndOverride.mockReturnValue(undefined);

        expect(guard.canActivate(mockContext({ role: 'MEMBER' }))).toBe(true);
    });

    it('should allow access when roles metadata is empty array', () => {
        reflector.getAllAndOverride.mockReturnValue([]);

        expect(guard.canActivate(mockContext({ role: 'MEMBER' }))).toBe(true);
    });

    it('should allow OWNER when roles require OWNER', () => {
        reflector.getAllAndOverride.mockReturnValue(['OWNER']);

        expect(guard.canActivate(mockContext({ role: 'OWNER' }))).toBe(true);
    });

    it('should allow ADMIN when roles require OWNER or ADMIN', () => {
        reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN']);

        expect(guard.canActivate(mockContext({ role: 'ADMIN' }))).toBe(true);
    });

    it('should throw ForbiddenException when MEMBER tries OWNER-only route', () => {
        reflector.getAllAndOverride.mockReturnValue(['OWNER']);

        expect(() => guard.canActivate(mockContext({ role: 'MEMBER' }))).toThrow(
            ForbiddenException,
        );
    });

    it('should throw ForbiddenException when MEMBER tries ADMIN-only route', () => {
        reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN']);

        expect(() => guard.canActivate(mockContext({ role: 'MEMBER' }))).toThrow(
            ForbiddenException,
        );
    });

    it('should throw ForbiddenException when no user on request', () => {
        reflector.getAllAndOverride.mockReturnValue(['OWNER']);

        expect(() => guard.canActivate(mockContext(null))).toThrow(ForbiddenException);
    });
});
