import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects')
export class ProjectsController {
    constructor(private projectsService: ProjectsService) { }

    @Roles('OWNER', 'ADMIN')
    @Post()
    create(@Body() dto: CreateProjectDto, @CurrentUser('organizationId') orgId: string) {
        return this.projectsService.create(dto, orgId);
    }

    @Get()
    findAll(@CurrentUser('organizationId') orgId: string) {
        return this.projectsService.findAll(orgId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
        return this.projectsService.findOne(id, orgId);
    }

    @Roles('OWNER', 'ADMIN')
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser('organizationId') orgId: string) {
        return this.projectsService.update(id, dto, orgId);
    }

    @Roles('OWNER')
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
        return this.projectsService.remove(id, orgId);
    }
}
