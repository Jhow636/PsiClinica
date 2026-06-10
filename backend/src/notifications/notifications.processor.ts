import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmailService, ReminderEmailData } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATIONS_QUEUE, JOBS } from './notifications.constants';
import { NotificationChannel, NotificationStatus } from '../../generated/prisma';

export interface ReminderJobData {
  appointmentId: string;
  notificationId: string;
  hoursAhead: 24 | 1;
}

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private email: EmailService,
    private prisma: PrismaService,
  ) {}

  @Process(JOBS.SEND_REMINDER_EMAIL)
  async handleReminderEmail(job: Job<ReminderJobData>): Promise<void> {
    const { appointmentId, notificationId, hoursAhead } = job.data;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        user: { include: { clinic: true } },
      },
    });

    if (!appointment) {
      this.logger.warn(`Appointment ${appointmentId} not found, skipping.`);
      return;
    }

    if (
      appointment.status === 'CANCELLED' ||
      appointment.status === 'COMPLETED' ||
      appointment.status === 'NO_SHOW'
    ) {
      this.logger.log(`Appointment ${appointmentId} is ${appointment.status}, skipping reminder.`);
      await this.updateNotificationStatus(notificationId, NotificationStatus.FAILED);
      return;
    }

    if (!appointment.patient.email) {
      this.logger.warn(`Patient ${appointment.patient.id} has no email, skipping.`);
      await this.updateNotificationStatus(notificationId, NotificationStatus.FAILED);
      return;
    }

    const baseUrl = process.env.CONFIRMATION_BASE_URL ?? 'http://localhost:3000';
    const confirmationUrl = `${baseUrl}/confirm/${notificationId}?action=confirm`;
    const cancellationUrl = `${baseUrl}/confirm/${notificationId}?action=cancel`;

    const emailData: ReminderEmailData = {
      to: appointment.patient.email,
      patientName: appointment.patient.name,
      appointmentDate: format(new Date(appointment.startTime), "EEEE, dd 'de' MMMM", { locale: ptBR }),
      appointmentTime: format(new Date(appointment.startTime), 'HH:mm'),
      psyName: appointment.user.name,
      confirmationUrl,
      cancellationUrl,
      hoursAhead,
    };

    await this.email.sendReminderEmail(emailData);
    await this.updateNotificationStatus(notificationId, NotificationStatus.SENT);
  }

  private async updateNotificationStatus(id: string, status: NotificationStatus): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { status, sentAt: status === NotificationStatus.SENT ? new Date() : undefined },
    });
  }
}
