import { IsEnum } from 'class-validator';

enum Role { OWNER = 'OWNER', ADMIN = 'ADMIN', MEMBER = 'MEMBER' }

export class UpdateRoleDto {
    @IsEnum(Role)
    role: string;
}
