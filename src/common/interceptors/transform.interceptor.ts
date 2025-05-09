import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta?: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();

        const meta = {};
        if (data && data.meta) {
          Object.assign(meta, data.meta);
          delete data.meta;
        }

        return {
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          data: data,
          ...(Object.keys(meta).length > 0 && { meta }),
        };
      }),
    );
  }
}
