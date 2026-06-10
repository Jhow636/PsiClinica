import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAnamnesisDto } from './dto/update-anamnesis.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PdfService } from './pdf.service';

@Injectable()
export class RecordsService {
  constructor(
    private prisma: PrismaService,
    private pdf: PdfService,
  ) {}

  private async getPatientClinicId(userId: string): Promise<string> {
    const clinic = await this.prisma.clinic.findUnique({ where: { userId } });
    if (!clinic) throw new ForbiddenException('Consultório não encontrado para este usuário');
    return clinic.id;
  }

  private async ensurePatientBelongsToUser(
    patientId: string,
    userId: string,
  ): Promise<void> {
    const clinicId = await this.getPatientClinicId(userId);
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    if (patient.clinicId !== clinicId)
      throw new ForbiddenException('Paciente não pertence ao seu consultório');
  }

  async getOrCreateRecord(userId: string, patientId: string) {
    await this.ensurePatientBelongsToUser(patientId, userId);

    const existing = await this.prisma.medicalRecord.findUnique({
      where: { patientId },
      include: {
        sessionNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            appointment: {
              select: {
                startTime: true,
                endTime: true,
                status: true,
                patient: { select: { name: true } },
              },
            },
          },
        },
        files: true,
      },
    });

    if (existing) return existing;

    return this.prisma.medicalRecord.create({
      data: { patientId },
      include: {
        sessionNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            appointment: {
              select: {
                startTime: true,
                endTime: true,
                status: true,
                patient: { select: { name: true } },
              },
            },
          },
        },
        files: true,
      },
    });
  }

  async updateAnamnesis(userId: string, patientId: string, dto: UpdateAnamnesisDto) {
    const record = await this.getOrCreateRecord(userId, patientId);
    return this.prisma.medicalRecord.update({
      where: { id: record.id },
      data: { anamnesis: dto.anamnesis },
    });
  }

  async createNote(userId: string, patientId: string, dto: CreateNoteDto) {
    const record = await this.getOrCreateRecord(userId, patientId);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });
    if (!appointment || appointment.patientId !== patientId) {
      throw new BadRequestException('A consulta não pertence a este paciente');
    }

    return this.prisma.sessionNote.create({
      data: {
        appointmentId: dto.appointmentId,
        medicalRecordId: record.id,
        content: dto.content,
        tags: dto.tags ?? [],
      },
    });
  }

  async updateNote(
    userId: string,
    patientId: string,
    noteId: string,
    dto: UpdateNoteDto,
  ) {
    await this.ensurePatientBelongsToUser(patientId, userId);

    const note = await this.prisma.sessionNote.findFirst({
      where: { id: noteId, medicalRecord: { patientId } },
    });
    if (!note) throw new NotFoundException('Anotação não encontrada');

    return this.prisma.sessionNote.update({
      where: { id: noteId },
      data: {
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
    });
  }

  async deleteNote(userId: string, patientId: string, noteId: string) {
    await this.ensurePatientBelongsToUser(patientId, userId);

    const note = await this.prisma.sessionNote.findFirst({
      where: { id: noteId, medicalRecord: { patientId } },
    });
    if (!note) throw new NotFoundException('Anotação não encontrada');

    await this.prisma.sessionNote.delete({ where: { id: noteId } });
  }

  async exportPdf(userId: string, patientId: string): Promise<Uint8Array> {
    const record = await this.getOrCreateRecord(userId, patientId);

    const clinic = await this.prisma.clinic.findUnique({ where: { userId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });

    if (!clinic || !user || !patient) throw new NotFoundException('Dados não encontrados.');

    return this.pdf.generateMedicalRecord({
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      patientBirthDate: patient.birthDate,
      clinicName: clinic.name,
      psychologistName: user.name,
      anamnesis: record.anamnesis,
      sessionNotes: record.sessionNotes.map((n) => ({
        id: n.id,
        content: n.content,
        tags: n.tags,
        createdAt: n.createdAt,
        appointment: n.appointment ? { startTime: n.appointment.startTime } : null,
      })),
      generatedAt: new Date(),
    });
  }
}
