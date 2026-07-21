import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { GameConfigModule } from './game-config/game-config.module';
import { PlayerAuthModule } from './auth/auth.module';
import { AdminAuthModule } from './auth/admin-auth.module';
import { SaveModule } from './save/save.module';

const frontendRoot = join(process.cwd(), '..');

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: frontendRoot,
      exclude: ['/api/(.*)'],
    }),
    DatabaseModule,
    GameConfigModule,
    PlayerAuthModule,
    AdminAuthModule,
    SaveModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
