import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AdminUsersService } from '../admin-users/admin-users.service';
import { ADMIN_COOKIE_NAME } from './admin.guard';
import { verifyPassword } from './password.util';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly jwtService: JwtService,
  ) {}

  private setAdminCookie(res: Response, adminUserId: number) {
    const payload = { sub: adminUserId, realm: 'admin' };
    const token = this.jwtService.sign(payload);
    res.cookie(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: COOKIE_MAX_AGE,
    });
    return token;
  }

  async login(email: string, password: string, res: Response) {
    const normalizedEmail = email.toLowerCase();
    const adminUser = await this.adminUsersService.findByEmail(normalizedEmail);
    if (!adminUser || !verifyPassword(password, adminUser.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.setAdminCookie(res, adminUser.id);
    return { user: this.adminUsersService.sanitize(adminUser) };
  }

  logout(res: Response) {
    res.clearCookie(ADMIN_COOKIE_NAME);
  }
}
