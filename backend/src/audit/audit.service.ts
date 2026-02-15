import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(params: {
        action: string;
        entity: string;
        entityId: string;
        userId: string;
        organizationId: string;
        metadata?: Record<string, any>;
    }) {
        return (this.prisma as any).auditLog.create({ data: params });
    }

    async findAll(
        organizationId: string,
        query: { page?: number; limit?: number },
    ) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            (this.prisma as any).auditLog.findMany({
                where: { organizationId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            (this.prisma as any).auditLog.count({ where: { organizationId } }),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
