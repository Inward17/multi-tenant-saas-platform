import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
export declare class OrganizationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(organizationId: string): Promise<{
        _count: {
            users: number;
            projects: number;
            tasks: number;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
    }>;
    update(organizationId: string, dto: UpdateOrganizationDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
    }>;
    remove(organizationId: string): Promise<{
        message: string;
    }>;
}
