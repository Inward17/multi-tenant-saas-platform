import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('me')
    getProfile(@CurrentUser('userId') userId: string) {
        return this.usersService.getProfile(userId);
    }

    @Patch('me')
    updateProfile(
        @CurrentUser('userId') userId: string,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(userId, dto);
    }

    @Patch('me/password')
    changePassword(
        @CurrentUser('userId') userId: string,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(userId, dto);
    }

    @Roles('OWNER', 'ADMIN')
    @Post('invite')
    addMember(
        @Body() dto: AddMemberDto,
        @CurrentUser() user: any,
    ) {
        return this.usersService.addMember(dto, user);
    }

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
