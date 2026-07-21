import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthGuard } from './admin.guard';
import { CurrentUser } from './current-user.decorator';
import { AdminUser } from '../admin-users/admin-user.entity';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    return this.adminAuthService.login(dto.email, dto.password, res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.adminAuthService.logout(res);
    return { ok: true };
  }
}

@Controller('admin')
export class AdminMeController {
  @Get('me')
  @UseGuards(AdminAuthGuard)
  getMe(@CurrentUser() adminUser: AdminUser) {
    const { passwordHash, ...rest } = adminUser as any;
    return rest;
  }
}
