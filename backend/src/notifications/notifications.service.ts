import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationStatus } from '../../generated/prisma';

export class NotificationSettingsDto {
  reminder24hEnabled!: boolean;
  reminder1hEnabled!: boolean;
  reminderEmailText!: string | null;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async handleConfirmation(notificationId: string, action: 'confirm' | 'cancel'): Promise<{ message: string }> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { appointment: true },
    });

    if (!notification) throw new NotFoundException('Link de confirmação inválido ou expirado.');

    if (notification.appointment.status === 'CANCELLED') {
      return { message: 'Esta sessão já foi cancelada.' };
    }
    if (notification.appointment.status === 'COMPLETED') {
      return { message: 'Esta sessão já foi realizada.' };
    }

    if (action === 'confirm') {
      await this.prisma.appointment.update({
        where: { id: notification.appointmentId },
        data: { status: 'CONFIRMED' },
      });
      return { message: 'Presença confirmada! Até breve.' };
    }

    if (action === 'cancel') {
      await this.prisma.appointment.update({
        where: { id: notification.appointmentId },
        data: { status: 'CANCELLED' },
      });
      return { message: 'Sessão cancelada. O profissional foi notificado.' };
    }

    throw new BadRequestException('Ação inválida.');
  }

  async getForAppointment(appointmentId: string) {
    return this.prisma.notification.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSettings(userId: string): Promise<NotificationSettingsDto> {
    const clinic = await this.prisma.clinic.findUnique({ where: { userId } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada.');
    return {
      reminder24hEnabled: clinic.reminder24hEnabled,
      reminder1hEnabled: clinic.reminder1hEnabled,
      reminderEmailText: clinic.reminderEmailText,
    };
  }

  async updateSettings(userId: string, dto: NotificationSettingsDto): Promise<NotificationSettingsDto> {
    const clinic = await this.prisma.clinic.findUnique({ where: { userId } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada.');

    const updated = await this.prisma.clinic.update({
      where: { userId },
      data: {
        reminder24hEnabled: dto.reminder24hEnabled,
        reminder1hEnabled: dto.reminder1hEnabled,
        reminderEmailText: dto.reminderEmailText ?? null,
      },
    });

    return {
      reminder24hEnabled: updated.reminder24hEnabled,
      reminder1hEnabled: updated.reminder1hEnabled,
      reminderEmailText: updated.reminderEmailText,
    };
  }
}
