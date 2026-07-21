import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PlayerAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SaveService } from './save.service';
import { GameConfigService } from '../game-config/game-config.service';
import { sanitizeAndValidateSave } from './save-guard';
import { Player } from '../players/player.entity';

@Controller('save')
@UseGuards(PlayerAuthGuard)
export class SaveController {
  constructor(
    private readonly saveService: SaveService,
    private readonly gameConfigService: GameConfigService,
  ) {}

  @Get()
  async getSave(@CurrentUser() player: Player) {
    const save = await this.saveService.findByUserId(player.id);
    if (!save) {
      return { save: null };
    }
    return { save: JSON.parse(save.saveJson), updatedAt: save.updatedAt };
  }

  @Put()
  async putSave(@CurrentUser() player: Player, @Body() body: any) {
    if (!body || typeof body.save === 'undefined' || body.save === null) {
      throw new BadRequestException('Missing save key in body');
    }

    const prev = await this.saveService.findByUserId(player.id);
    const prevSave = prev ? JSON.parse(prev.saveJson) : null;
    const prevUpdatedAt = prev ? prev.updatedAt : null;

    const config = await this.gameConfigService.getConfig();
    const { save } = sanitizeAndValidateSave(
      prevSave,
      prevUpdatedAt,
      body.save,
      {
        staffDefs: config.staff,
        upgradeDefs: config.upgrades,
        pumpMultiplier: (config.settings as any).pumpMultiplier ?? 10,
      },
      Date.now(),
    );

    const saved = await this.saveService.upsert(player.id, save);
    return { save: JSON.parse(saved.saveJson), updatedAt: saved.updatedAt };
  }
}
