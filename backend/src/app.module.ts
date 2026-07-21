import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { GameConfigModule } from './game-config/game-config.module';

@Module({
  imports: [DatabaseModule, GameConfigModule],
  controllers: [HealthController],
})
export class AppModule {}
