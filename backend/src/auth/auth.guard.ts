import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

export const COOKIE_NAME = 'crypto_idle_auth';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.disabled) {
        throw new UnauthorizedException();
      }
      (request as any).user = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
