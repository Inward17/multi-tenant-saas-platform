import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('metrics')
export class MetricsController {
    constructor(private metricsService: MetricsService) { }

    @Roles('OWNER')
    @Get()
    getMetrics(@CurrentUser('organizationId') orgId: string) {
        return this.metricsService.getOrgMetrics(orgId);
    }
}
