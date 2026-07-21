import { Controller, Get } from '@nestjs/common';
import { GameConfigService } from './game-config.service';

@Controller('config')
export class GameConfigController {
  constructor(private readonly gameConfigService: GameConfigService) {}

  @Get()
  getConfig() {
    return this.gameConfigService.getConfig();
  }
}
