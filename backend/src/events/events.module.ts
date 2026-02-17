import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'saas-backend-jwt-secret-key-2026',
            signOptions: { expiresIn: '24h' },
        }),
    ],
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class EventsModule { }
