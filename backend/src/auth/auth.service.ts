import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { PlayersService } from '../players/players.service';
import { PLAYER_COOKIE_NAME } from './auth.guard';
import { hashPassword, verifyPassword } from './password.util';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class PlayerAuthService {
  constructor(
    private readonly playersService: PlayersService,
    private readonly jwtService: JwtService,
  ) {}

  private setPlayerCookie(res: Response, playerId: number) {
    const payload = { sub: playerId, realm: 'player' };
    const token = this.jwtService.sign(payload);
    res.cookie(PLAYER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: COOKIE_MAX_AGE,
    });
    return token;
  }

  async registerAndLogin(email: string, password: string, res: Response) {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.playersService.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const player = await this.playersService.create({
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    });

    this.setPlayerCookie(res, player.id);
    return { user: this.playersService.sanitize(player) };
  }

  async login(email: string, password: string, res: Response) {
    const normalizedEmail = email.toLowerCase();
    const player = await this.playersService.findByEmail(normalizedEmail);
    if (!player || !verifyPassword(password, player.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.setPlayerCookie(res, player.id);
    return { user: this.playersService.sanitize(player) };
  }

  logout(res: Response) {
    res.clearCookie(PLAYER_COOKIE_NAME);
  }
}
