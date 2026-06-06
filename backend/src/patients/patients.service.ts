import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ListPatientsDto } from './dto/list-patients.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  private async getClinicId(userId: string): Promise<string> {
    const clinic = await this.prisma.clinic.findUnique({ where: { userId } });
    if (!clinic) throw new ForbiddenException('Consultório não encontrado para este usuário');
    return clinic.id;
  }

  async create(userId: string, dto: CreatePatientDto) {
    const clinicId = await this.getClinicId(userId);
    return this.prisma.patient.create({
      data: {
        clinicId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        cpf: dto.cpf,
        address: dto.address,
        notes: dto.notes,
        sessionPrice: dto.sessionPrice ? dto.sessionPrice : undefined,
      },
    });
  }

  async findAll(userId: string, query: ListPatientsDto) {
    const clinicId = await this.getClinicId(userId);
    const { search, orderBy = 'name', order = 'asc', page = 1, limit = 20 } = query;

    const where = {
      clinicId,
      isActive: true,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        orderBy: { [orderBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          birthDate: true,
          sessionPrice: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.patient.count({ where }),
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
    const clinicId = await this.getClinicId(userId);
    const patient = await this.prisma.patient.findFirst({
      where: { id, clinicId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async update(userId: string, id: string, dto: UpdatePatientDto) {
    await this.findOne(userId, id);
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
