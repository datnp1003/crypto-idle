import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminUser } from './admin-user.entity';
import { AdminUsersService } from './admin-users.service';
import { AuditService } from '../audit/audit.service';
import { hashPassword } from '../auth/password.util';
import { CreateAdminDto } from './dto/create-admin.dto';
import { SetDisabledDto } from './dto/set-disabled.dto';

@Controller('admin/admins')
@UseGuards(AdminAuthGuard)
export class AdminsController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async list() {
    const admins = await this.adminUsersService.findAll();
    return admins.map((a) => this.adminUsersService.sanitize(a));
  }

  @Post()
  async create(@Body() dto: CreateAdminDto, @CurrentUser() admin: AdminUser) {
    const email = dto.email.toLowerCase();
    if (await this.adminUsersService.findByEmail(email)) {
      throw new ConflictException('Email already exists');
    }
    const created = await this.adminUsersService.create({
      email,
      passwordHash: hashPassword(dto.password),
    });
    await this.auditService.log(
      admin.id,
      admin.email,
      'create_admin',
      'admin',
      String(created.id),
    );
    return this.adminUsersService.sanitize(created);
  }

  @Patch(':id/disabled')
  async setDisabled(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetDisabledDto,
    @CurrentUser() admin: AdminUser,
  ) {
    if (id === admin.id) {
      throw new BadRequestException('Cannot change your own disabled state');
    }
    const target = await this.adminUsersService.setDisabled(id, dto.disabled);
    if (!target) throw new NotFoundException(`Admin ${id} not found`);
    await this.auditService.log(
      admin.id,
      admin.email,
      'set_admin_disabled',
      'admin',
      String(id),
      { disabled: dto.disabled },
    );
    return this.adminUsersService.sanitize(target);
  }
}
