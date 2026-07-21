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

  sanitize(player: Player) {
    const { passwordHash, ...rest } = player as any;
    return rest;
  }
}
