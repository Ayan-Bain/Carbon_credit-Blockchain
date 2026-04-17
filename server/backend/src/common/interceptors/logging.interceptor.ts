import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): any {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();
    const controllerPath = context.getClass().name;
    const handlerName = context.getHandler().name;

    return (next.handle() as any).pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        this.logger.log(
          `[${controllerPath}.${handlerName}] ${method} ${url} ${response.statusCode} - ${delay}ms`,
        );
      }),
    ) as any;
  }
}
