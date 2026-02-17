import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    DATABASE_URL: Joi.string().required()
        .description('PostgreSQL connection string'),

    JWT_SECRET: Joi.string().min(16).required()
        .description('Secret key for JWT signing (min 16 chars)'),

    PORT: Joi.number().default(3000)
        .description('Server port'),

    COOKIE_DOMAIN: Joi.string().optional()
        .description('Domain for auth cookies'),

    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),

    REDIS_URL: Joi.string().default('redis://localhost:6379')
        .description('Redis connection URL for WebSocket and BullMQ'),
});
