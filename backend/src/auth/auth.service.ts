import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { UsersService } from '../users/users.service';
import { COOKIE_NAME } from './auth.guard';
import { Response } from 'express';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, hashHex] = stored.split(':');
    const hash = scryptSync(password, salt, 64);
    const storedHash = Buffer.from(hashHex, 'hex');
    return timingSafeEqual(hash, storedHash);
  }

  private setAuthCookie(res: Response, userId: number) {
    const payload = { sub: userId };
    const token = this.jwtService.sign(payload);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: COOKIE_MAX_AGE,
    });
    return token;
  }

  async register(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.usersService.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const userCount = await this.usersService.count();
    const role = userCount === 0 ? 'admin' : 'player';

    const user = await this.usersService.create({
      email: normalizedEmail,
      passwordHash: this.hashPassword(password),
      role,
    });

    return { user: this.usersService.sanitize(user) };
  }

  async registerAndLogin(email: string, password: string, res: Response) {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.usersService.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const userCount = await this.usersService.count();
    const role = userCount === 0 ? 'admin' : 'player';

    const user = await this.usersService.create({
      email: normalizedEmail,
      passwordHash: this.hashPassword(password),
      role,
    });

    this.setAuthCookie(res, user.id);
    return { user: this.usersService.sanitize(user) };
  }

  async login(email: string, password: string, res: Response) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.setAuthCookie(res, user.id);
    return { user: this.usersService.sanitize(user) };
  }

  logout(res: Response) {
    res.clearCookie(COOKIE_NAME);
  }
}
