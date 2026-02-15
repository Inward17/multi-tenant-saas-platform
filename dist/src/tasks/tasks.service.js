"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TasksService = class TasksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, organizationId) {
        const project = await this.prisma.project.findFirst({
            where: { id: dto.projectId, organizationId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found in your organization');
        }
        if (dto.assignedTo) {
            const assignee = await this.prisma.user.findFirst({
                where: { id: dto.assignedTo, organizationId },
            });
            if (!assignee) {
                throw new common_1.NotFoundException('Assigned user not found in your organization');
            }
        }
        return this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                status: dto.status || 'TODO',
                projectId: dto.projectId,
                assignedTo: dto.assignedTo,
                organizationId,
            },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, email: true } },
            },
        });
    }
    async findAll(organizationId, query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const where = { organizationId };
        if (query.status) {
            where.status = query.status;
        }
        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip,
                take: limit,
                include: {
                    project: { select: { id: true, name: true } },
                    assignee: { select: { id: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.task.count({ where }),
        ]);
        return {
            data: tasks,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, organizationId) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, email: true } },
            },
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        return task;
    }
    async update(id, dto, currentUser) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId: currentUser.organizationId },
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        if (currentUser.role === 'MEMBER' && task.assignedTo !== currentUser.userId) {
            throw new common_1.ForbiddenException('You can only update tasks assigned to you');
        }
        if (dto.assignedTo) {
            const assignee = await this.prisma.user.findFirst({
                where: { id: dto.assignedTo, organizationId: currentUser.organizationId },
            });
            if (!assignee) {
                throw new common_1.NotFoundException('Assigned user not found in your organization');
            }
        }
        return this.prisma.task.update({
            where: { id },
            data: dto,
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, email: true } },
            },
        });
    }
    async remove(id, organizationId) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        await this.prisma.task.delete({ where: { id } });
        return { message: 'Task deleted successfully' };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map