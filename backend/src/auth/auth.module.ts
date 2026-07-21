import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController, MeController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { UsersModule } from '../users/users.module';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController, MeController],
  exports: [AuthGuard],
})
export class AuthModule {}
