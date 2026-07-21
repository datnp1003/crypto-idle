import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { GameConfigModule } from './game-config/game-config.module';
import { AuthModule } from './auth/auth.module';
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
    AuthModule,
    SaveModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
