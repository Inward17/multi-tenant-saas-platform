import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
    let service: TasksService;
    let repo: {
        create: jest.Mock;
        findMany: jest.Mock;
        findOne: jest.Mock;
        findById: jest.Mock;
        update: jest.Mock;
        softDelete: jest.Mock;
        restore: jest.Mock;
        findProjectInOrg: jest.Mock;
        findUserInOrg: jest.Mock;
    };
    let audit: { log: jest.Mock };
    let eventsGateway: {
        broadcastTaskCreated: jest.Mock;
        broadcastTaskUpdated: jest.Mock;
        broadcastTaskDeleted: jest.Mock;
    };
    let notificationsQueue: { add: jest.Mock };

    beforeEach(async () => {
        repo = {
            create: jest.fn(),
            findMany: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            findProjectInOrg: jest.fn(),
            findUserInOrg: jest.fn(),
        };
        audit = { log: jest.fn().mockResolvedValue({}) };
        eventsGateway = {
            broadcastTaskCreated: jest.fn(),
            broadcastTaskUpdated: jest.fn(),
            broadcastTaskDeleted: jest.fn(),
        };
        notificationsQueue = { add: jest.fn().mockResolvedValue({}) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                { provide: TasksRepository, useValue: repo },
                { provide: AuditService, useValue: audit },
                { provide: EventsGateway, useValue: eventsGateway },
                { provide: getQueueToken('notifications'), useValue: notificationsQueue },
            ],
        }).compile();

        service = module.get<TasksService>(TasksService);
    });

    // ─── CREATE ──────────────────────────────────────────────

    describe('create', () => {
        const dto = { title: 'Fix bug', projectId: 'proj-1' };
        const orgId = 'org-1';

        it('should create a task when project belongs to org', async () => {
            repo.findProjectInOrg.mockResolvedValue({ id: 'proj-1', organizationId: orgId });
            repo.create.mockResolvedValue({ id: 'task-1', ...dto, organizationId: orgId });

            const result = await service.create(dto, orgId, 'user-1');

            expect(repo.findProjectInOrg).toHaveBeenCalledWith('proj-1', orgId);
            expect(result.id).toBe('task-1');
        });

        it('should throw NotFoundException when project not in org', async () => {
            repo.findProjectInOrg.mockResolvedValue(null);

            await expect(service.create(dto, orgId)).rejects.toThrow(NotFoundException);
        });

        it('should validate assignee belongs to org', async () => {
            const dtoWithAssignee = { ...dto, assignedTo: 'user-99' };
            repo.findProjectInOrg.mockResolvedValue({ id: 'proj-1' });
            repo.findUserInOrg.mockResolvedValue(null);

            await expect(service.create(dtoWithAssignee, orgId)).rejects.toThrow(NotFoundException);
        });

        it('should accept valid assignee within org', async () => {
            const dtoWithAssignee = { ...dto, assignedTo: 'user-1' };
            repo.findProjectInOrg.mockResolvedValue({ id: 'proj-1' });
            repo.findUserInOrg.mockResolvedValue({ id: 'user-1', organizationId: orgId });
            repo.create.mockResolvedValue({ id: 'task-1', assignedTo: 'user-1' });

            const result = await service.create(dtoWithAssignee, orgId, 'user-1');
            expect(result.assignedTo).toBe('user-1');
        });

        it('should log TASK_CREATED audit event', async () => {
            repo.findProjectInOrg.mockResolvedValue({ id: 'proj-1' });
            repo.create.mockResolvedValue({ id: 'task-1' });

            await service.create(dto, orgId, 'user-1');

            expect(audit.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'TASK_CREATED', entity: 'Task' }),
            );
        });

        it('should log TASK_ASSIGNED when assignee provided', async () => {
            const dtoWithAssignee = { ...dto, assignedTo: 'user-2' };
            repo.findProjectInOrg.mockResolvedValue({ id: 'proj-1' });
            repo.findUserInOrg.mockResolvedValue({ id: 'user-2' });
            repo.create.mockResolvedValue({ id: 'task-1', assignedTo: 'user-2' });

            await service.create(dtoWithAssignee, orgId, 'user-1');

            expect(audit.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'TASK_ASSIGNED' }),
            );
        });
    });

    // ─── FIND ALL (PAGINATION) ───────────────────────────────

    describe('findAll', () => {
        it('should return paginated results with meta', async () => {
            repo.findMany.mockResolvedValue({ data: [{ id: 'task-1' }, { id: 'task-2' }], total: 15 });

            const result = await service.findAll('org-1', { page: 2, limit: 5 });

            expect(result.meta).toEqual({ total: 15, page: 2, limit: 5, totalPages: 3 });
            expect(result.data).toHaveLength(2);
        });

        it('should default to page 1 and limit 10', async () => {
            repo.findMany.mockResolvedValue({ data: [], total: 0 });

            const result = await service.findAll('org-1', {});

            expect(result.meta.page).toBe(1);
            expect(result.meta.limit).toBe(10);
        });

        it('should pass search parameter to repository', async () => {
            repo.findMany.mockResolvedValue({ data: [], total: 0 });

            await service.findAll('org-1', { search: 'bug' });

            expect(repo.findMany).toHaveBeenCalledWith('org-1', expect.objectContaining({ search: 'bug' }));
        });
    });

    // ─── FIND ONE ────────────────────────────────────────────

    describe('findOne', () => {
        it('should return task when found in org', async () => {
            repo.findOne.mockResolvedValue({ id: 'task-1', organizationId: 'org-1' });

            const result = await service.findOne('task-1', 'org-1');
            expect(result.id).toBe('task-1');
        });

        it('should throw NotFoundException for cross-org access', async () => {
            repo.findOne.mockResolvedValue(null);

            await expect(service.findOne('task-1', 'org-other')).rejects.toThrow(NotFoundException);
        });
    });

    // ─── UPDATE ──────────────────────────────────────────────

    describe('update', () => {
        const currentUser = { userId: 'user-1', organizationId: 'org-1', role: 'ADMIN' };

        it('should update task when user is ADMIN', async () => {
            repo.findById.mockResolvedValue({ id: 'task-1', organizationId: 'org-1', status: 'TODO' });
            repo.update.mockResolvedValue({ id: 'task-1', status: 'DONE' });

            const result = await service.update('task-1', { status: 'DONE' }, currentUser);
            expect(result.status).toBe('DONE');
        });

        it('should throw ForbiddenException when MEMBER updates unassigned task', async () => {
            const member = { userId: 'user-2', organizationId: 'org-1', role: 'MEMBER' };
            repo.findById.mockResolvedValue({
                id: 'task-1', organizationId: 'org-1', assignedTo: 'user-1',
            });

            await expect(
                service.update('task-1', { status: 'DONE' }, member),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should allow MEMBER to update their own task', async () => {
            const member = { userId: 'user-2', organizationId: 'org-1', role: 'MEMBER' };
            repo.findById.mockResolvedValue({
                id: 'task-1', organizationId: 'org-1', assignedTo: 'user-2',
            });
            repo.update.mockResolvedValue({ id: 'task-1', status: 'IN_PROGRESS' });

            const result = await service.update('task-1', { status: 'IN_PROGRESS' }, member);
            expect(result.status).toBe('IN_PROGRESS');
        });

        it('should throw NotFoundException for cross-org update', async () => {
            repo.findById.mockResolvedValue(null);

            await expect(
                service.update('task-1', { status: 'DONE' }, currentUser),
            ).rejects.toThrow(NotFoundException);
        });

        it('should validate assignee on reassignment', async () => {
            repo.findById.mockResolvedValue({ id: 'task-1', organizationId: 'org-1' });
            repo.findUserInOrg.mockResolvedValue(null);

            await expect(
                service.update('task-1', { assignedTo: 'user-ghost' }, currentUser),
            ).rejects.toThrow(NotFoundException);
        });

        it('should log TASK_ASSIGNED on reassignment', async () => {
            repo.findById.mockResolvedValue({ id: 'task-1', organizationId: 'org-1', assignedTo: 'user-1' });
            repo.findUserInOrg.mockResolvedValue({ id: 'user-2' });
            repo.update.mockResolvedValue({ id: 'task-1', assignedTo: 'user-2' });

            await service.update('task-1', { assignedTo: 'user-2' }, currentUser);

            expect(audit.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'TASK_ASSIGNED',
                    metadata: expect.objectContaining({ previousAssignee: 'user-1' }),
                }),
            );
        });

        it('should log TASK_STATUS_CHANGED on status update', async () => {
            repo.findById.mockResolvedValue({ id: 'task-1', organizationId: 'org-1', status: 'TODO' });
            repo.update.mockResolvedValue({ id: 'task-1', status: 'DONE' });

            await service.update('task-1', { status: 'DONE' }, currentUser);

            expect(audit.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'TASK_STATUS_CHANGED',
                    metadata: expect.objectContaining({ from: 'TODO', to: 'DONE' }),
                }),
            );
        });
    });

    // ─── REMOVE (SOFT DELETE) ────────────────────────────────

    describe('remove', () => {
        it('should soft-delete task within org', async () => {
            repo.findById.mockResolvedValue({ id: 'task-1', title: 'Fix bug' });
            repo.softDelete.mockResolvedValue({});

            const result = await service.remove('task-1', 'org-1', 'user-1');
            expect(result.message).toBe('Task deleted successfully');
            expect(repo.softDelete).toHaveBeenCalledWith('task-1');
        });

        it('should throw NotFoundException for cross-org delete', async () => {
            repo.findById.mockResolvedValue(null);

            await expect(service.remove('task-1', 'org-other')).rejects.toThrow(NotFoundException);
        });

        it('should log TASK_DELETED audit event', async () => {
            repo.findById.mockResolvedValue({ id: 'task-1', title: 'Fix bug' });
            repo.softDelete.mockResolvedValue({});

            await service.remove('task-1', 'org-1', 'user-1');

            expect(audit.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'TASK_DELETED', entity: 'Task' }),
            );
        });
    });
});
