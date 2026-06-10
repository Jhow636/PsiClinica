import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class UpdateClinicDto {
  name!: string;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  sessionPrice?: string | null;
}

@Injectable()
export class ClinicService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const clinic = await this.prisma.clinic.findUnique({ where: { userId } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada.');
    return clinic;
  }

  async updateProfile(userId: string, dto: UpdateClinicDto) {
    const clinic = await this.prisma.clinic.findUnique({ where: { userId } });
    if (!clinic) throw new NotFoundException('Clínica não encontrada.');

    return this.prisma.clinic.update({
      where: { userId },
      data: {
        name: dto.name,
        address: dto.address ?? null,
        phone: dto.phone ?? null,
        logoUrl: dto.logoUrl ?? null,
        sessionPrice: dto.sessionPrice ? dto.sessionPrice : null,
      },
    });
  }
}
