import { Controller, Get, Patch, Delete, Body } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('organizations')
export class OrganizationsController {
    constructor(private organizationsService: OrganizationsService) { }

    @Get()
    findOne(@CurrentUser('organizationId') orgId: string) {
        return this.organizationsService.findOne(orgId);
    }

    @Roles('OWNER')
    @Patch()
    update(
        @CurrentUser('organizationId') orgId: string,
        @Body() dto: UpdateOrganizationDto,
    ) {
        return this.organizationsService.update(orgId, dto);
    }

    @Roles('OWNER')
    @Delete()
    remove(@CurrentUser('organizationId') orgId: string) {
        return this.organizationsService.remove(orgId);
    }
}
