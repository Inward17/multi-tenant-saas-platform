import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { EventsModule } from '../events/events.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
    imports: [EventsModule, JobsModule],
    controllers: [TasksController],
    providers: [TasksService, TasksRepository],
})
export class TasksModule { }
