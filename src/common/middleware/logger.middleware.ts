import { Injectable, NestMiddleware, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, body } = req;
    const startTime = Date.now();

    const errorChunks: any[] = [];

    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = (...args: any[]) => {
      errorChunks.push(Buffer.from(args[0]));
      return originalWrite.apply(res, args);
    };

    res.end = (...args: any[]) => {
      if (args[0]) {
        errorChunks.push(Buffer.from(args[0]));
      }
      return originalEnd.apply(res, args);
    };

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      const isError = statusCode >= 400;
      const responseBody = Buffer.concat(errorChunks).toString('utf8');

      const logMessage = `
🛰️  ${method} ${originalUrl}
📝 Body: ${JSON.stringify(body)}
📤 Status: ${statusCode} (${HttpStatus[statusCode] || 'Unknown'})
⏱️  Response Time: ${responseTime}ms
${isError ? `🚨 Response Body:\n${responseBody}\n` : ''}
      `.trim();

      if (isError) {
        this.logger.error(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
