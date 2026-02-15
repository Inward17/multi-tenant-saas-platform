import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(RolesGuard)
export class TasksController {
    constructor(private tasksService: TasksService) { }

    @Post()
    @Roles('OWNER', 'ADMIN')
    create(
        @Body() dto: CreateTaskDto,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.tasksService.create(dto, organizationId);
    }

    @Get()
    findAll(
        @CurrentUser('organizationId') organizationId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
    ) {
        return this.tasksService.findAll(organizationId, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            status,
        });
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.tasksService.findOne(id, organizationId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateTaskDto,
        @CurrentUser() currentUser: { userId: string; organizationId: string; role: string },
    ) {
        return this.tasksService.update(id, dto, currentUser);
    }

    @Delete(':id')
    @Roles('OWNER', 'ADMIN')
    remove(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.tasksService.remove(id, organizationId);
    }
}
