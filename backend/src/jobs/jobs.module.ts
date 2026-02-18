import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsProcessor } from './notifications.processor';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const redisUrl = config.get('REDIS_URL', 'redis://localhost:6379');
                const url = new URL(redisUrl);
                return {
                    connection: {
                        host: url.hostname,
                        port: parseInt(url.port || '6379'),
                        username: url.username,
                        password: url.password,
                        // Upstash/Render requires TLS. 'rediss:' indicates TLS.
                        // We set generic TLS options to ensure connection.
                        ...(url.protocol === 'rediss:' && {
                            tls: {
                                rejectUnauthorized: false,
                            },
                        }),
                    },
                };
            },
        }),
        BullModule.registerQueue({ name: 'notifications' }),
    ],
    providers: [NotificationsProcessor],
    exports: [BullModule],
})
export class JobsModule { }
