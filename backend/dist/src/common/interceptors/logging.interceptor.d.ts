import { ExecutionContext, CallHandler } from '@nestjs/common';
export declare class LoggingInterceptor {
    private readonly logger;
    intercept(context: ExecutionContext, next: CallHandler): any;
}
