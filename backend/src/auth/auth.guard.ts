import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PlayersService } from '../players/players.service';

export const PLAYER_COOKIE_NAME = 'crypto_idle_player';

@Injectable()
export class PlayerAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly playersService: PlayersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[PLAYER_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (payload.realm !== 'player') {
        throw new UnauthorizedException();
      }
      const player = await this.playersService.findById(payload.sub);
      if (!player || player.disabled) {
        throw new UnauthorizedException();
      }
      (request as any).user = player;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
