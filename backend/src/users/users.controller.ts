import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Roles('OWNER', 'ADMIN')
    @Get()
    findAll(@CurrentUser('organizationId') orgId: string) {
        return this.usersService.findAll(orgId);
    }

    @Roles('OWNER')
    @Patch(':id/role')
    updateRole(
        @Param('id') id: string,
        @Body() dto: UpdateRoleDto,
        @CurrentUser() user: any,
    ) {
        return this.usersService.updateRole(id, dto, user);
    }
}
