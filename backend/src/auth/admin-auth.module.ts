import { Module } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController, AdminMeController } from './admin-auth.controller';
import { AdminAuthGuard } from './admin.guard';
import { AdminUsersModule } from '../admin-users/admin-users.module';

@Module({
  imports: [AdminUsersModule],
  providers: [AdminAuthService, AdminAuthGuard],
  controllers: [AdminAuthController, AdminMeController],
  exports: [AdminAuthGuard, AdminUsersModule],
})
export class AdminAuthModule {}
