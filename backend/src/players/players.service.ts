import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
  ) {}

  async count(): Promise<number> {
    return this.playerRepo.count();
  }

  async findByEmail(email: string): Promise<Player | null> {
    return this.playerRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findById(id: number): Promise<Player | null> {
    return this.playerRepo.findOne({ where: { id } });
  }

  async create(data: Partial<Player>): Promise<Player> {
    const player = this.playerRepo.create(data);
    return this.playerRepo.save(player);
  }

  async setDisabled(id: number, disabled: boolean): Promise<Player | null> {
    const player = await this.findById(id);
    if (!player) return null;
    player.disabled = disabled;
    return this.playerRepo.save(player);
  }

  async findAll(): Promise<Player[]> {
    return this.playerRepo.find({ order: { id: 'ASC' } });
  }

  sanitize(player: Player) {
    const { passwordHash, ...rest } = player as any;
    return rest;
  }
}
