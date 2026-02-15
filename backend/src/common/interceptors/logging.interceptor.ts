import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url } = req;
        const requestId = randomUUID();
        const userId = req.user?.userId || 'anonymous';
        const organizationId = req.user?.organizationId || '-';
        const start = Date.now();

        req.requestId = requestId;

        return next.handle().pipe(
            tap({
                next: () => {
                    const durationMs = Date.now() - start;
                    const statusCode = context.switchToHttp().getResponse().statusCode;
                    this.logger.log(
                        JSON.stringify({
                            requestId,
                            userId,
                            organizationId,
                            method,
                            route: url,
                            statusCode,
                            durationMs,
                        }),
                    );
                },
                error: (err) => {
                    const durationMs = Date.now() - start;
                    this.logger.error(
                        JSON.stringify({
                            requestId,
                            userId,
                            organizationId,
                            method,
                            route: url,
                            statusCode: err.status || 500,
                            durationMs,
                            error: err.message,
                        }),
                    );
                },
            }),
        );
    }
}
