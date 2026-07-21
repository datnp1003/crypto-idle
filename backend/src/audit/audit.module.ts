import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AdminAuthModule } from '../auth/admin-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), AdminAuthModule],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService, TypeOrmModule],
})
export class AuditModule {}
