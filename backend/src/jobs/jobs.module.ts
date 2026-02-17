import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsProcessor } from './notifications.processor';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: new URL(config.get('REDIS_URL', 'redis://localhost:6379')).hostname,
                    port: parseInt(new URL(config.get('REDIS_URL', 'redis://localhost:6379')).port || '6379'),
                },
            }),
        }),
        BullModule.registerQueue({ name: 'notifications' }),
    ],
    providers: [NotificationsProcessor],
    exports: [BullModule],
})
export class JobsModule { }
