import { IsString, IsOptional, IsEnum } from 'class-validator';

enum TaskStatus { TODO = 'TODO', IN_PROGRESS = 'IN_PROGRESS', DONE = 'DONE' }

export class UpdateTaskDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TaskStatus)
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    assignedTo?: string;
}
