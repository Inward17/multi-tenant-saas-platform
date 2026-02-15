import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
    constructor(private prisma: PrismaService) { }

    async getOrgMetrics(organizationId: string) {
        const [
            totalUsers,
            totalProjects,
            totalTasks,
            todoCount,
            inProgressCount,
            doneCount,
        ] = await Promise.all([
            this.prisma.user.count({ where: { organizationId } }),
            this.prisma.project.count({ where: { organizationId, deletedAt: null } as any }),
            this.prisma.task.count({ where: { organizationId, deletedAt: null } as any }),
            this.prisma.task.count({ where: { organizationId, status: 'TODO', deletedAt: null } as any }),
            this.prisma.task.count({ where: { organizationId, status: 'IN_PROGRESS', deletedAt: null } as any }),
            this.prisma.task.count({ where: { organizationId, status: 'DONE', deletedAt: null } as any }),
        ]);

        return {
            users: totalUsers,
            projects: totalProjects,
            tasks: {
                total: totalTasks,
                byStatus: {
                    todo: todoCount,
                    inProgress: inProgressCount,
                    done: doneCount,
                },
            },
        };
    }
}
