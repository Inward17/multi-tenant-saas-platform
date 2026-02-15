import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    @Roles('OWNER', 'ADMIN')
    findAll(@CurrentUser('organizationId') organizationId: string) {
        return this.usersService.findAll(organizationId);
    }

    @Patch(':id/role')
    @Roles('OWNER')
    updateRole(
        @Param('id') userId: string,
        @Body() dto: UpdateRoleDto,
        @CurrentUser() currentUser: { userId: string; organizationId: string; role: string },
    ) {
        return this.usersService.updateRole(userId, dto, currentUser);
    }
}
