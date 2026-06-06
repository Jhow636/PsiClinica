import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecordsService } from './records.service';
import { PrismaService } from '../prisma/prisma.service';

const mockClinic = { id: 'clinic-1', userId: 'user-1' };
const mockPatient = { id: 'patient-1', clinicId: 'clinic-1', name: 'Ana Lima' };
const mockRecord = {
  id: 'record-1',
  patientId: 'patient-1',
  anamnesis: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  sessionNotes: [],
  files: [],
};
const mockNote = {
  id: 'note-1',
  appointmentId: 'appt-1',
  medicalRecordId: 'record-1',
  content: 'Sessão produtiva',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  clinic: { findUnique: jest.fn() },
  patient: { findUnique: jest.fn() },
  medicalRecord: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  sessionNote: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
  appointment: { findUnique: jest.fn() },
};

describe('RecordsService', () => {
  let service: RecordsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RecordsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(RecordsService);
    jest.clearAllMocks();
  });

  describe('getOrCreateRecord', () => {
    it('should create record when none exists', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient);
      prismaMock.medicalRecord.findUnique.mockResolvedValue(null);
      prismaMock.medicalRecord.create.mockResolvedValue(mockRecord);

      const result = await service.getOrCreateRecord('user-1', 'patient-1');

      expect(prismaMock.medicalRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { patientId: 'patient-1' } }),
      );
      expect(result).toEqual(mockRecord);
    });

    it('should return existing record', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient);
      prismaMock.medicalRecord.findUnique.mockResolvedValue(mockRecord);

      const result = await service.getOrCreateRecord('user-1', 'patient-1');

      expect(prismaMock.medicalRecord.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockRecord);
    });
  });

  describe('createNote', () => {
    it('should throw BadRequestException when appointmentId does not belong to patient', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient);
      prismaMock.medicalRecord.findUnique.mockResolvedValue(mockRecord);
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 'appt-1',
        patientId: 'other-patient',
      });

      await expect(
        service.createNote('user-1', 'patient-1', {
          appointmentId: 'appt-1',
          content: 'Nota',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteNote', () => {
    it('should throw NotFoundException when note not found', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient);
      prismaMock.sessionNote.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteNote('user-1', 'patient-1', 'nonexistent-note'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
