import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SaveService } from './save.service';
import { GameConfigService } from '../game-config/game-config.service';
import { sanitizeAndValidateSave } from './save-guard';
import { User } from '../users/user.entity';

@Controller('save')
@UseGuards(AuthGuard)
export class SaveController {
  constructor(
    private readonly saveService: SaveService,
    private readonly gameConfigService: GameConfigService,
  ) {}

  @Get()
  async getSave(@CurrentUser() user: User) {
    const save = await this.saveService.findByUserId(user.id);
    if (!save) {
      return { save: null };
    }
    return { save: JSON.parse(save.saveJson), updatedAt: save.updatedAt };
  }

  @Put()
  async putSave(@CurrentUser() user: User, @Body() body: any) {
    if (!body || typeof body.save === 'undefined' || body.save === null) {
      throw new BadRequestException('Missing save key in body');
    }

    const prev = await this.saveService.findByUserId(user.id);
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

    const saved = await this.saveService.upsert(user.id, save);
    return { save: JSON.parse(saved.saveJson), updatedAt: saved.updatedAt };
  }
}
