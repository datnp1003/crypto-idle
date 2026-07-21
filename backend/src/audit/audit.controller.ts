import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin.guard';
import { AuditService } from './audit.service';

@Controller('admin/audit')
@UseGuards(AdminAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const l = Number.parseInt(limit ?? '', 10);
    const o = Number.parseInt(offset ?? '', 10);
    return this.auditService.list(
      Number.isFinite(l) && l > 0 ? l : 50,
      Number.isFinite(o) && o >= 0 ? o : 0,
    );
  }
}
