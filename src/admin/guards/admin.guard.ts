import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ContactTypeEnum } from 'enums';
import { Contact, RequestWithUser } from 'types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    const validateAdmin = (user: Contact): boolean => {
      return user.type === ContactTypeEnum.ADMIN;
    };

    if (!user || !validateAdmin(user)) {
      throw new ForbiddenException('Access denied: Admins only.');
    }

    return true;
  }
}
