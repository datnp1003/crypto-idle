import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AdminUsersService } from '../admin-users/admin-users.service';

export const ADMIN_COOKIE_NAME = 'crypto_idle_admin';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[ADMIN_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (payload.realm !== 'admin') {
        throw new UnauthorizedException();
      }
      const adminUser = await this.adminUsersService.findById(payload.sub);
      if (!adminUser || adminUser.disabled) {
        throw new UnauthorizedException();
      }
      (request as any).user = adminUser;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
