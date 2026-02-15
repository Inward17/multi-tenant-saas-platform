import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateProjectDto, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
    }>;
    findAll(organizationId: string): Promise<({
        _count: {
            tasks: number;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
    })[]>;
    findOne(id: string, organizationId: string): Promise<{
        tasks: {
            id: string;
            organizationId: string;
            createdAt: Date;
            title: string;
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            projectId: string;
            assignedTo: string | null;
            updatedAt: Date;
        }[];
        _count: {
            tasks: number;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
    }>;
    update(id: string, dto: UpdateProjectDto, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
    }>;
    remove(id: string, organizationId: string): Promise<{
        message: string;
    }>;
}
