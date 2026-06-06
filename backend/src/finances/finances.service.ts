import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '../../generated/prisma';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

@Injectable()
export class FinancesService {
  constructor(private prisma: PrismaService) {}

  private async getClinicId(userId: string): Promise<string> {
    const clinic = await this.prisma.clinic.findUnique({ where: { userId } });
    if (!clinic) throw new ForbiddenException('Consultório não encontrado para este usuário');
    return clinic.id;
  }

  async create(userId: string, dto: CreatePaymentDto) {
    await this.getClinicId(userId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: dto.appointmentId, userId },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado ou não pertence ao usuário');

    const existing = await this.prisma.payment.findUnique({
      where: { appointmentId: dto.appointmentId },
    });
    if (existing) throw new ConflictException('Já existe um pagamento para este agendamento');

    const status = dto.status ?? PaymentStatus.PENDING;
    const paidAt = status === PaymentStatus.PAID ? new Date() : null;

    return this.prisma.payment.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId: appointment.patientId,
        amount: dto.amount,
        method: dto.method,
        status,
        paidAt,
      },
    });
  }

  async findAll(userId: string, query: ListPaymentsDto) {
    const { patientId, status, dateFrom, dateTo, page = 1, limit = 20 } = query;

    const where: Record<string, unknown> = {
      appointment: { userId },
    };

    if (patientId) where['patientId'] = patientId;
    if (status) where['status'] = status;
    if (dateFrom || dateTo) {
      where['createdAt'] = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: { select: { id: true, name: true, email: true } },
          appointment: { select: { id: true, startTime: true, status: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, appointment: { userId } },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        appointment: { select: { id: true, startTime: true, endTime: true, status: true } },
      },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }

  async updateStatus(userId: string, id: string, dto: UpdatePaymentStatusDto) {
    await this.findOne(userId, id);

    let paidAt: Date | null | undefined;
    if (dto.status === PaymentStatus.PAID) {
      paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    } else if (dto.status === PaymentStatus.PENDING || dto.status === PaymentStatus.CANCELLED) {
      paidAt = null;
    }

    return this.prisma.payment.update({
      where: { id },
      data: {
        status: dto.status,
        method: dto.method,
        paidAt,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.payment.delete({ where: { id } });
  }

  async getSummary(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [paidAggregate, pendingAggregate, countPaid, countPending, countCancelled] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            appointment: { userId },
            status: PaymentStatus.PAID,
            paidAt: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            appointment: { userId },
            status: PaymentStatus.PENDING,
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.count({
          where: {
            appointment: { userId },
            status: PaymentStatus.PAID,
            paidAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        this.prisma.payment.count({
          where: {
            appointment: { userId },
            status: PaymentStatus.PENDING,
          },
        }),
        this.prisma.payment.count({
          where: {
            appointment: { userId },
            status: PaymentStatus.CANCELLED,
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
      ]);

    return {
      totalPaid: paidAggregate._sum.amount ?? 0,
      totalPending: pendingAggregate._sum.amount ?? 0,
      countPaid,
      countPending,
      countCancelled,
    };
  }
}
