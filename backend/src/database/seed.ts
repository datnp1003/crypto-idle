import { DataSource } from 'typeorm';
import { StaffModule } from '../game-config/entities/staff-module.entity';
import { UpgradeModule } from '../game-config/entities/upgrade-module.entity';
import { GameSetting } from '../game-config/entities/game-setting.entity';
import { Player } from '../players/player.entity';
import { AdminUser } from '../admin-users/admin-user.entity';
import { STAFF_SEED, UPGRADES_SEED, SETTINGS_SEED } from '../game-config/seed-data';
import { hashPassword } from '../auth/password.util';

async function seed() {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: 'data/crypto-idle.sqlite',
    entities: [StaffModule, UpgradeModule, GameSetting, Player, AdminUser],
    synchronize: true,
  });
  await dataSource.initialize();
  console.log('Database connected');

  const staffRepo = dataSource.getRepository(StaffModule);
  const upgradeRepo = dataSource.getRepository(UpgradeModule);
  const settingRepo = dataSource.getRepository(GameSetting);
  const adminUserRepo = dataSource.getRepository(AdminUser);

  // Seed staff
  for (const s of STAFF_SEED) {
    await staffRepo.save(staffRepo.create(s));
  }
  console.log(`Seeded ${STAFF_SEED.length} staff modules`);

  // Seed upgrades
  for (const u of UPGRADES_SEED) {
    await upgradeRepo.save(upgradeRepo.create(u));
  }
  console.log(`Seeded ${UPGRADES_SEED.length} upgrade modules`);

  // Seed settings
  for (const s of SETTINGS_SEED) {
    await settingRepo.save(settingRepo.create(s));
  }
  console.log(`Seeded ${SETTINGS_SEED.length} settings`);

  // Seed root admin (idempotent)
  const adminCount = await adminUserRepo.count();
  if (adminCount === 0) {
    const admin = adminUserRepo.create({
      email: 'admin@local',
      passwordHash: hashPassword('admin1234'),
    });
    await adminUserRepo.save(admin);
    console.log('Seeded root admin: admin@local / admin1234');
  }

  await dataSource.destroy();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
