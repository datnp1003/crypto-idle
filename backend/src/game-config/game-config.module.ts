import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffModule } from './entities/staff-module.entity';
import { UpgradeModule } from './entities/upgrade-module.entity';
import { GameSetting } from './entities/game-setting.entity';
import { GameConfigService } from './game-config.service';
import { GameConfigController } from './game-config.controller';
import { AdminGameConfigController } from './admin-game-config.controller';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffModule, UpgradeModule, GameSetting]),
    AdminAuthModule,
    AuditModule,
  ],
  controllers: [GameConfigController, AdminGameConfigController],
  providers: [GameConfigService],
  exports: [GameConfigService],
})
export class GameConfigModule {}
