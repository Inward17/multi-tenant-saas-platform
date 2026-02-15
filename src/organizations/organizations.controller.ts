import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('organizations')
@UseGuards(RolesGuard)
export class OrganizationsController {
    constructor(private organizationsService: OrganizationsService) { }

    @Get()
    findOne(@CurrentUser('organizationId') organizationId: string) {
        return this.organizationsService.findOne(organizationId);
    }

    @Patch()
    @Roles('OWNER')
    update(
        @CurrentUser('organizationId') organizationId: string,
        @Body() dto: UpdateOrganizationDto,
    ) {
        return this.organizationsService.update(organizationId, dto);
    }

    @Delete()
    @Roles('OWNER')
    remove(@CurrentUser('organizationId') organizationId: string) {
        return this.organizationsService.remove(organizationId);
    }
}
