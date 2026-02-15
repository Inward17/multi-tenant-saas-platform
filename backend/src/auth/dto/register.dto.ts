import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    organizationName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;
}
