import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffModule } from './entities/staff-module.entity';
import { UpgradeModule } from './entities/upgrade-module.entity';
import { GameSetting } from './entities/game-setting.entity';
import { GameConfigService } from './game-config.service';
import { GameConfigController } from './game-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StaffModule, UpgradeModule, GameSetting])],
  controllers: [GameConfigController],
  providers: [GameConfigService],
  exports: [GameConfigService],
})
export class GameConfigModule {}
