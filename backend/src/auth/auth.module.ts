import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlayerAuthService } from './auth.service';
import { PlayerAuthController, PlayerMeController } from './auth.controller';
import { PlayerAuthGuard } from './auth.guard';
import { PlayersModule } from '../players/players.module';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

@Module({
  imports: [
    PlayersModule,
    JwtModule.register({
      global: true,
      secret: JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [PlayerAuthService, PlayerAuthGuard],
  controllers: [PlayerAuthController, PlayerMeController],
  exports: [PlayerAuthGuard],
})
export class PlayerAuthModule {}
