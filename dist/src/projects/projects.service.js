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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, organizationId) {
        return this.prisma.project.create({
            data: {
                name: dto.name,
                organizationId,
            },
        });
    }
    async findAll(organizationId) {
        return this.prisma.project.findMany({
            where: { organizationId },
            include: {
                _count: { select: { tasks: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, organizationId) {
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId },
            include: {
                tasks: true,
                _count: { select: { tasks: true } },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        return project;
    }
    async update(id, dto, organizationId) {
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        return this.prisma.project.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id, organizationId) {
        const project = await this.prisma.project.findFirst({
            where: { id, organizationId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        await this.prisma.project.delete({ where: { id } });
        return { message: 'Project deleted successfully' };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map