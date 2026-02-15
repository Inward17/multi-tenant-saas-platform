import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;
}
