import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class AddMemberDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password: string;

    @IsOptional()
    @IsIn(['ADMIN', 'MEMBER'])
    role?: 'ADMIN' | 'MEMBER';
}
