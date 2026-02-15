import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
export declare class OrganizationsController {
    private organizationsService;
    constructor(organizationsService: OrganizationsService);
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
