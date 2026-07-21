import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminUser } from '../admin-users/admin-user.entity';
import { GameConfigService } from './game-config.service';
import { AuditService } from '../audit/audit.service';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateUpgradeDto } from './dto/update-upgrade.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminGameConfigController {
  constructor(
    private readonly gameConfigService: GameConfigService,
    private readonly auditService: AuditService,
  ) {}

  @Get('staff')
  getAllStaff(@Query('includeDisabled') includeDisabled?: string) {
    return this.gameConfigService.findAllStaff(includeDisabled === 'true');
  }

  @Get('staff/:id')
  getStaff(@Param('id') id: string) {
    return this.gameConfigService.findStaffById(id);
  }

  @Put('staff/:id')
  async updateStaff(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() admin: AdminUser,
  ) {
    const result = await this.gameConfigService.updateStaff(id, dto);
    await this.auditService.log(admin.id, admin.email, 'update_staff', 'staff', id);
    return result;
  }

  @Patch('staff/:id/enabled')
  async setStaffEnabled(
    @Param('id') id: string,
    @Body('enabled') enabled: boolean,
    @CurrentUser() admin: AdminUser,
  ) {
    const result = await this.gameConfigService.setStaffEnabled(id, enabled);
    await this.auditService.log(admin.id, admin.email, 'toggle_staff', 'staff', id, {
      enabled,
    });
    return result;
  }

  @Get('upgrades')
  getAllUpgrades(@Query('includeDisabled') includeDisabled?: string) {
    return this.gameConfigService.findAllUpgrades(includeDisabled === 'true');
  }

  @Get('upgrades/:id')
  getUpgrade(@Param('id') id: string) {
    return this.gameConfigService.findUpgradeById(id);
  }

  @Put('upgrades/:id')
  async updateUpgrade(
    @Param('id') id: string,
    @Body() dto: UpdateUpgradeDto,
    @CurrentUser() admin: AdminUser,
  ) {
    const result = await this.gameConfigService.updateUpgrade(id, dto);
    await this.auditService.log(admin.id, admin.email, 'update_upgrade', 'upgrade', id);
    return result;
  }

  @Patch('upgrades/:id/enabled')
  async setUpgradeEnabled(
    @Param('id') id: string,
    @Body('enabled') enabled: boolean,
    @CurrentUser() admin: AdminUser,
  ) {
    const result = await this.gameConfigService.setUpgradeEnabled(id, enabled);
    await this.auditService.log(admin.id, admin.email, 'toggle_upgrade', 'upgrade', id, {
      enabled,
    });
    return result;
  }

  @Get('settings')
  getAllSettings() {
    return this.gameConfigService.findAllSettings();
  }

  @Put('settings/:key')
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() admin: AdminUser,
  ) {
    const result = await this.gameConfigService.updateSetting(key, dto);
    await this.auditService.log(admin.id, admin.email, 'update_setting', 'setting', key);
    return result;
  }
}
