import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminUser } from './admin-user.entity';
import { PlayersService } from '../players/players.service';
import { SaveService } from '../save/save.service';
import { AuditService } from '../audit/audit.service';
import { SetDisabledDto } from './dto/set-disabled.dto';

@Controller('admin/players')
@UseGuards(AdminAuthGuard)
export class AdminPlayersController {
  constructor(
    private readonly playersService: PlayersService,
    private readonly saveService: SaveService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async list() {
    const players = await this.playersService.findAll();
    return Promise.all(
      players.map(async (p) => ({
        ...this.playersService.sanitize(p),
        hasSave: (await this.saveService.findByUserId(p.id)) != null,
      })),
    );
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const player = await this.playersService.findById(id);
    if (!player) throw new NotFoundException(`Player ${id} not found`);
    const save = await this.saveService.findByUserId(id);
    let parsed: unknown = null;
    if (save) {
      try {
        parsed = JSON.parse(save.saveJson);
      } catch {
        parsed = null;
      }
    }
    return {
      ...this.playersService.sanitize(player),
      save: parsed,
      saveUpdatedAt: save?.updatedAt ?? null,
    };
  }

  @Delete(':id/save')
  async resetSave(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: AdminUser,
  ) {
    await this.saveService.removeByUserId(id);
    await this.auditService.log(
      admin.id,
      admin.email,
      'reset_player_save',
      'player',
      String(id),
    );
    return { ok: true };
  }

  @Patch(':id/disabled')
  async setDisabled(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetDisabledDto,
    @CurrentUser() admin: AdminUser,
  ) {
    const player = await this.playersService.setDisabled(id, dto.disabled);
    if (!player) throw new NotFoundException(`Player ${id} not found`);
    await this.auditService.log(
      admin.id,
      admin.email,
      'set_player_disabled',
      'player',
      String(id),
      { disabled: dto.disabled },
    );
    return this.playersService.sanitize(player);
  }
}
