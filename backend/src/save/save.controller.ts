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
import { User } from '../users/user.entity';

@Controller('save')
@UseGuards(AuthGuard)
export class SaveController {
  constructor(private readonly saveService: SaveService) {}

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
    const save = await this.saveService.upsert(user.id, body.save);
    return { save: JSON.parse(save.saveJson), updatedAt: save.updatedAt };
  }
}
