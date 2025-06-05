import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'common';
import { AuthService } from '../auth.service';
import { RequestWithUser } from 'types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req: RequestWithUser = context.switchToHttp().getRequest();
    const authHeader =
      typeof req.headers['authorization'] === 'string'
        ? req.headers['authorization']
        : undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.authService.validateToken(token);
      req.user = payload;
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      throw new UnauthorizedException(message);
    }
  }
}
