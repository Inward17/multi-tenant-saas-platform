import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(RolesGuard)
export class ProjectsController {
    constructor(private projectsService: ProjectsService) { }

    @Post()
    @Roles('OWNER', 'ADMIN')
    create(
        @Body() dto: CreateProjectDto,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.projectsService.create(dto, organizationId);
    }

    @Get()
    findAll(@CurrentUser('organizationId') organizationId: string) {
        return this.projectsService.findAll(organizationId);
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.projectsService.findOne(id, organizationId);
    }

    @Patch(':id')
    @Roles('OWNER', 'ADMIN')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateProjectDto,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.projectsService.update(id, dto, organizationId);
    }

    @Delete(':id')
    @Roles('OWNER')
    remove(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.projectsService.remove(id, organizationId);
    }
}
