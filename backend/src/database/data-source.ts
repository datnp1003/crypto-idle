import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ensureDataDir } from './ensure-data-dir';
import { StaffModule } from '../game-config/entities/staff-module.entity';
import { UpgradeModule } from '../game-config/entities/upgrade-module.entity';
import { GameSetting } from '../game-config/entities/game-setting.entity';
import { Player } from '../players/player.entity';
import { AdminUser } from '../admin-users/admin-user.entity';
import { PlayerSave } from '../save/player-save.entity';
import { AuditLog } from '../audit/audit-log.entity';

const dbPath = path.join(ensureDataDir(), 'crypto-idle.sqlite');

export const dataSourceOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: dbPath,
  entities: [StaffModule, UpgradeModule, GameSetting, Player, AdminUser, PlayerSave, AuditLog],
  synchronize: true,
};

export default new DataSource(dataSourceOptions);
