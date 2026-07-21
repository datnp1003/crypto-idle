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
import { AdminGuard } from '../auth/admin.guard';
import { GameConfigService } from './game-config.service';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateUpgradeDto } from './dto/update-upgrade.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminGameConfigController {
  constructor(private readonly gameConfigService: GameConfigService) {}

  @Get('staff')
  getAllStaff(@Query('includeDisabled') includeDisabled?: string) {
    return this.gameConfigService.findAllStaff(includeDisabled === 'true');
  }

  @Get('staff/:id')
  getStaff(@Param('id') id: string) {
    return this.gameConfigService.findStaffById(id);
  }

  @Put('staff/:id')
  updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.gameConfigService.updateStaff(id, dto);
  }

  @Patch('staff/:id/enabled')
  setStaffEnabled(@Param('id') id: string, @Body('enabled') enabled: boolean) {
    return this.gameConfigService.setStaffEnabled(id, enabled);
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
  updateUpgrade(@Param('id') id: string, @Body() dto: UpdateUpgradeDto) {
    return this.gameConfigService.updateUpgrade(id, dto);
  }

  @Patch('upgrades/:id/enabled')
  setUpgradeEnabled(@Param('id') id: string, @Body('enabled') enabled: boolean) {
    return this.gameConfigService.setUpgradeEnabled(id, enabled);
  }

  @Get('settings')
  getAllSettings() {
    return this.gameConfigService.findAllSettings();
  }

  @Put('settings/:key')
  updateSetting(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.gameConfigService.updateSetting(key, dto);
  }
}
