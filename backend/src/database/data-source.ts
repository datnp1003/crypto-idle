import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ensureDataDir } from './ensure-data-dir';
import { StaffModule } from '../game-config/entities/staff-module.entity';
import { UpgradeModule } from '../game-config/entities/upgrade-module.entity';
import { GameSetting } from '../game-config/entities/game-setting.entity';

const dbPath = path.join(ensureDataDir(), 'crypto-idle.sqlite');

export const dataSourceOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: dbPath,
  entities: [StaffModule, UpgradeModule, GameSetting],
  synchronize: true,
};

export default new DataSource(dataSourceOptions);
