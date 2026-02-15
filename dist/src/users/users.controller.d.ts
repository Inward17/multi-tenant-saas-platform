import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(organizationId: string): Promise<{
        email: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        organizationId: string;
        createdAt: Date;
    }[]>;
    updateRole(userId: string, dto: UpdateRoleDto, currentUser: {
        userId: string;
        organizationId: string;
        role: string;
    }): Promise<{
        email: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        organizationId: string;
        createdAt: Date;
    }>;
}
