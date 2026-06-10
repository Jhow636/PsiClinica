import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService, NotificationSettingsDto } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get('confirm/:notificationId')
  @ApiOperation({ summary: 'Confirmar ou cancelar presença via link' })
  async confirm(
    @Param('notificationId') notificationId: string,
    @Query('action') action: string,
  ) {
    if (action !== 'confirm' && action !== 'cancel') {
      throw new BadRequestException('Parâmetro action deve ser confirm ou cancel.');
    }
    return this.notifications.handleConfirmation(notificationId, action);
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar configurações de notificações' })
  async getSettings(@CurrentUser() user: { id: string }) {
    return this.notifications.getSettings(user.id);
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Salvar configurações de notificações' })
  async updateSettings(
    @CurrentUser() user: { id: string },
    @Body() dto: NotificationSettingsDto,
  ) {
    return this.notifications.updateSettings(user.id, dto);
  }
}
