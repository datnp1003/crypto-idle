import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from './admin-user.entity';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,
  ) {}

  async count(): Promise<number> {
    return this.adminUserRepo.count();
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.adminUserRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findById(id: number): Promise<AdminUser | null> {
    return this.adminUserRepo.findOne({ where: { id } });
  }

  async create(data: Partial<AdminUser>): Promise<AdminUser> {
    const adminUser = this.adminUserRepo.create(data);
    return this.adminUserRepo.save(adminUser);
  }

  async setDisabled(id: number, disabled: boolean): Promise<AdminUser | null> {
    const adminUser = await this.findById(id);
    if (!adminUser) return null;
    adminUser.disabled = disabled;
    return this.adminUserRepo.save(adminUser);
  }

  async findAll(): Promise<AdminUser[]> {
    return this.adminUserRepo.find({ order: { id: 'ASC' } });
  }

  sanitize(adminUser: AdminUser) {
    const { passwordHash, ...rest } = adminUser as any;
    return rest;
  }
}
