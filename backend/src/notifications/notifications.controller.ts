import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

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
}
