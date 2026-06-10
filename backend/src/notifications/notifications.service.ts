import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationStatus } from '../../generated/prisma';

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
}
