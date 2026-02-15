import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

enum TaskStatus { TODO = 'TODO', IN_PROGRESS = 'IN_PROGRESS', DONE = 'DONE' }

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TaskStatus)
    @IsOptional()
    status?: string;

    @IsString()
    @IsNotEmpty()
    projectId: string;

    @IsString()
    @IsOptional()
    assignedTo?: string;
}
