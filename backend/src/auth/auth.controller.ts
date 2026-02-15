import { Controller, Post, Get, Body, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
};

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('register')
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { token, user } = await this.authService.register(dto);
        res.cookie('access_token', token, COOKIE_OPTIONS);
        return { user };
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { token, user } = await this.authService.login(dto);
        res.cookie('access_token', token, COOKIE_OPTIONS);
        return { user };
    }

    @Get('me')
    async getMe(@CurrentUser('userId') userId: string) {
        return this.authService.getMe(userId);
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token', { path: '/' });
        return { message: 'Logged out successfully' };
    }
}
