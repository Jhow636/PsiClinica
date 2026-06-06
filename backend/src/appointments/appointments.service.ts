import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  private async getClinicId(userId: string): Promise<string> {
    const clinic = await this.prisma.clinic.findUnique({ where: { userId } });
    if (!clinic) throw new ForbiddenException('Consultório não encontrado para este usuário');
    return clinic.id;
  }

  async create(userId: string, dto: CreateAppointmentDto) {
    const clinicId = await this.getClinicId(userId);

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, clinicId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Paciente não encontrado neste consultório');

    return this.prisma.appointment.create({
      data: {
        userId,
        patientId: dto.patientId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        notes: dto.notes,
        isRecurring: dto.isRecurring ?? false,
        recurrenceRule: dto.recurrenceRule,
      },
    });
  }

  async findAll(userId: string, query: ListAppointmentsDto) {
    const { dateFrom, dateTo, patientId, status, page = 1, limit = 50 } = query;

    const where: Record<string, unknown> = { userId };

    if (dateFrom || dateTo) {
      where['startTime'] = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    if (patientId) where['patientId'] = patientId;
    if (status) where['status'] = status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.appointment.count({ where }),
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
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, userId },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    await this.findOne(userId, id);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      },
    });
  }

  async updateStatus(userId: string, id: string, dto: UpdateStatusDto) {
    await this.findOne(userId, id);
    return this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.appointment.delete({ where: { id } });
  }
}
