import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerSave } from './player-save.entity';
import { SaveService } from './save.service';
import { SaveController } from './save.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { GameConfigModule } from '../game-config/game-config.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerSave]), UsersModule, AuthModule, GameConfigModule],
  providers: [SaveService],
  controllers: [SaveController],
})
export class SaveModule {}
