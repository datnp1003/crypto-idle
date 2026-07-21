import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerSave } from './player-save.entity';
import { SaveService } from './save.service';
import { SaveController } from './save.controller';
import { PlayersModule } from '../players/players.module';
import { PlayerAuthModule } from '../auth/auth.module';
import { GameConfigModule } from '../game-config/game-config.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerSave]), PlayersModule, PlayerAuthModule, GameConfigModule],
  providers: [SaveService],
  controllers: [SaveController],
  exports: [SaveService],
})
export class SaveModule {}
