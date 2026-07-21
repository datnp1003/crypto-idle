import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    actorUserId: number,
    actorEmail: string,
    action: string,
    targetType: string,
    targetId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    const entry = this.auditRepo.create({
      actorUserId,
      actorEmail,
      action,
      targetType,
      targetId: targetId ?? null,
      detailsJson: details ? JSON.stringify(details) : null,
    } as Partial<AuditLog>);
    await this.auditRepo.save(entry);
  }

  async list(limit = 50, offset = 0): Promise<{ items: AuditLog[]; total: number }> {
    const [items, total] = await this.auditRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { items, total };
  }
}
