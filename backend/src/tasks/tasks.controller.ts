import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tasks')
export class TasksController {
    constructor(private tasksService: TasksService) { }

    @Roles('OWNER', 'ADMIN')
    @Post()
    create(@Body() dto: CreateTaskDto, @CurrentUser('organizationId') orgId: string) {
        return this.tasksService.create(dto, orgId);
    }

    @Get()
    findAll(
        @CurrentUser('organizationId') orgId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
    ) {
        return this.tasksService.findAll(orgId, {
            page: page ? +page : undefined,
            limit: limit ? +limit : undefined,
            status,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
        return this.tasksService.findOne(id, orgId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() user: any) {
        return this.tasksService.update(id, dto, user);
    }

    @Roles('OWNER', 'ADMIN')
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
        return this.tasksService.remove(id, orgId);
    }
}
