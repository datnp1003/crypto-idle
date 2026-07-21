import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffModule } from './entities/staff-module.entity';
import { UpgradeModule } from './entities/upgrade-module.entity';
import { GameSetting } from './entities/game-setting.entity';

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
}
