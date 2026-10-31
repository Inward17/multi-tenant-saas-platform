import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Trust proxy for rate limiting behind load balancers (Render)
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // Cookie parser — MUST be before guards
  app.use(cookieParser());

  // CSRF: the auth cookie is SameSite=None in prod, so cross-site forms would carry it.
  // A custom header can't be sent cross-origin without a CORS preflight, which only FRONTEND_URL passes.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method) || req.get('x-requested-with') === 'XMLHttpRequest') return next();
    res.status(403).json({ statusCode: 403, message: 'Missing X-Requested-With header' });
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS with credentials for cookie-based auth
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
