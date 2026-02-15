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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId) {
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
    async updateRole(userId, dto, currentUser) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        if (targetUser.organizationId !== currentUser.organizationId) {
            throw new common_1.ForbiddenException('User does not belong to your organization');
        }
        if (targetUser.id === currentUser.userId) {
            throw new common_1.ForbiddenException('Cannot change your own role');
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map