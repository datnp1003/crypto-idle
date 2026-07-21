import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PlayerAuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PlayerAuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { Player } from '../players/player.entity';

@Controller('auth')
export class PlayerAuthController {
  constructor(private readonly playerAuthService: PlayerAuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.playerAuthService.registerAndLogin(dto.email, dto.password, res);
    res.status(201);
    return result;
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.playerAuthService.login(dto.email, dto.password, res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.playerAuthService.logout(res);
    return { ok: true };
  }
}

@Controller()
export class PlayerMeController {
  @Get('me')
  @UseGuards(PlayerAuthGuard)
  getMe(@CurrentUser() player: Player) {
    const { passwordHash, ...rest } = player as any;
    return rest;
  }
}
