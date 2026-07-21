import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerSave } from './player-save.entity';

@Injectable()
export class SaveService {
  constructor(
    @InjectRepository(PlayerSave)
    private readonly saveRepo: Repository<PlayerSave>,
  ) {}

  async findByUserId(userId: number): Promise<PlayerSave | null> {
    return this.saveRepo.findOne({ where: { userId } });
  }

  async upsert(userId: number, savePayload: unknown): Promise<PlayerSave> {
    const saveJson = JSON.stringify(savePayload);
    let existing = await this.saveRepo.findOne({ where: { userId } });
    if (existing) {
      existing.saveJson = saveJson;
      return this.saveRepo.save(existing);
    }
    const record = this.saveRepo.create({ userId, saveJson });
    return this.saveRepo.save(record);
  }
}
