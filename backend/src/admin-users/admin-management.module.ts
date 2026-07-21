import { Module } from '@nestjs/common';
import { AdminPlayersController } from './admin-players.controller';
import { AdminsController } from './admins.controller';
import { PlayersModule } from '../players/players.module';
import { AdminUsersModule } from './admin-users.module';
import { SaveModule } from '../save/save.module';
import { AuditModule } from '../audit/audit.module';
import { AdminAuthModule } from '../auth/admin-auth.module';

@Module({
  imports: [
    PlayersModule,
    AdminUsersModule,
    SaveModule,
    AuditModule,
    AdminAuthModule,
  ],
  controllers: [AdminPlayersController, AdminsController],
})
export class AdminManagementModule {}
