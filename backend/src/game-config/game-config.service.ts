import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffModule } from './entities/staff-module.entity';
import { UpgradeModule } from './entities/upgrade-module.entity';
import { GameSetting } from './entities/game-setting.entity';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateUpgradeDto } from './dto/update-upgrade.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class GameConfigService {
  constructor(
    @InjectRepository(StaffModule)
    private readonly staffRepo: Repository<StaffModule>,
    @InjectRepository(UpgradeModule)
    private readonly upgradeRepo: Repository<UpgradeModule>,
    @InjectRepository(GameSetting)
    private readonly settingRepo: Repository<GameSetting>,
  ) {}

  async getConfig() {
    const staff = await this.staffRepo.find({ where: { enabled: true }, order: { sortOrder: 'ASC' } });
    const upgrades = await this.upgradeRepo.find({ where: { enabled: true }, order: { sortOrder: 'ASC' } });
    const settingsRaw = await this.settingRepo.find();
    const settings: Record<string, unknown> = {};
    for (const s of settingsRaw) {
      try {
        settings[s.key] = JSON.parse(s.valueJson);
      } catch {
        settings[s.key] = s.valueJson;
      }
    }
    return { staff, upgrades, settings };
  }

  async findAllStaff(includeDisabled = false) {
    const where = includeDisabled ? {} : { enabled: true };
    return this.staffRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  async findStaffById(id: string) {
    const staff = await this.staffRepo.findOne({ where: { id } });
    if (!staff) throw new NotFoundException(`Staff ${id} not found`);
    return staff;
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    const staff = await this.findStaffById(id);
    Object.assign(staff, dto);
    return this.staffRepo.save(staff);
  }

  async setStaffEnabled(id: string, enabled: boolean) {
    const staff = await this.findStaffById(id);
    staff.enabled = enabled;
    return this.staffRepo.save(staff);
  }

  async findAllUpgrades(includeDisabled = false) {
    const where = includeDisabled ? {} : { enabled: true };
    return this.upgradeRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  async findUpgradeById(id: string) {
    const upgrade = await this.upgradeRepo.findOne({ where: { id } });
    if (!upgrade) throw new NotFoundException(`Upgrade ${id} not found`);
    return upgrade;
  }

  async updateUpgrade(id: string, dto: UpdateUpgradeDto) {
    const upgrade = await this.findUpgradeById(id);
    Object.assign(upgrade, dto);
    return this.upgradeRepo.save(upgrade);
  }

  async setUpgradeEnabled(id: string, enabled: boolean) {
    const upgrade = await this.findUpgradeById(id);
    upgrade.enabled = enabled;
    return this.upgradeRepo.save(upgrade);
  }

  async findAllSettings() {
    return this.settingRepo.find();
  }

  async findSettingByKey(key: string) {
    const setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting ${key} not found`);
    return setting;
  }

  async updateSetting(key: string, dto: UpdateSettingDto) {
    const setting = await this.findSettingByKey(key);
    setting.valueJson = JSON.stringify(dto.value);
    return this.settingRepo.save(setting);
  }
}
