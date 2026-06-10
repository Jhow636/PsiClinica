import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { addHours, subMinutes } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATIONS_QUEUE, JOBS } from './notifications.constants';
import { NotificationStatus, NotificationType, NotificationChannel } from '../../generated/prisma';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private queue: Queue,
    private prisma: PrismaService,
  ) {}

  // Runs every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async scheduleReminders(): Promise<void> {
    if (process.env.REMINDER_24H_ENABLED !== 'true' && process.env.REMINDER_1H_ENABLED !== 'true') {
      return;
    }

    const now = new Date();

    await Promise.all([
      this.processWindow(now, 24, NotificationType.REMINDER_24H),
      this.processWindow(now, 1, NotificationType.REMINDER_1H),
    ]);
  }

  private async processWindow(
    now: Date,
    hoursAhead: 24 | 1,
    type: NotificationType,
  ): Promise<void> {
    const enabled =
      hoursAhead === 24
        ? process.env.REMINDER_24H_ENABLED === 'true'
        : process.env.REMINDER_1H_ENABLED === 'true';

    if (!enabled) return;

    // Target: appointments starting in [hoursAhead - 1min, hoursAhead + 1min]
    const windowStart = subMinutes(addHours(now, hoursAhead), 1);
    const windowEnd = addHours(now, hoursAhead);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: { gte: windowStart, lte: windowEnd },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        patient: { email: { not: null } },
      },
      include: { patient: true },
    });

    for (const appt of appointments) {
      const alreadySent = await this.prisma.notification.findFirst({
        where: {
          appointmentId: appt.id,
          type,
          status: { in: [NotificationStatus.SENT, NotificationStatus.PENDING] },
        },
      });
      if (alreadySent) continue;

      const notification = await this.prisma.notification.create({
        data: {
          patientId: appt.patientId,
          appointmentId: appt.id,
          type,
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.PENDING,
        },
      });

      await this.queue.add(
        JOBS.SEND_REMINDER_EMAIL,
        { appointmentId: appt.id, notificationId: notification.id, hoursAhead },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );

      this.logger.log(
        `Queued ${hoursAhead}h reminder for appointment ${appt.id} (patient: ${appt.patient.name})`,
      );
    }
  }
}
