import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class AuditService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway,
    ) { }

    async log(params: {
        action: string;
        entity: string;
        entityId: string;
        userId: string;
        organizationId: string;
        metadata?: Record<string, any>;
    }) {
        const entry = await (this.prisma as any).auditLog.create({ data: params });

        // Broadcast activity in real-time to org room
        this.eventsGateway.broadcastActivity(params.organizationId, entry);

        return entry;
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

        // Enrich logs with performer email if missing (for historical data)
        const userIds = [...new Set(data.map((l) => l.userId).filter((id) => id !== 'system'))];
        const users = await (this.prisma as any).user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true },
        });

        const userMap = new Map(users.map((u) => [u.id, u.email]));

        const enrichedData = data.map((log) => {
            const meta = (log.metadata as Record<string, any>) || {};
            if (!meta.performerEmail && log.userId !== 'system') {
                meta.performerEmail = userMap.get(log.userId) || 'Unknown';
            }
            return { ...log, metadata: meta };
        });

        return {
            data: enrichedData,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
