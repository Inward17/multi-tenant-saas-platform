import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('audit')
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Roles('OWNER', 'ADMIN')
    @Get()
    findAll(
        @CurrentUser('organizationId') orgId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.auditService.findAll(orgId, {
            page: page ? +page : undefined,
            limit: limit ? +limit : undefined,
        });
    }
}
