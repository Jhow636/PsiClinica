import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';

const mockClinic = { id: 'clinic-1', userId: 'user-1' };
const mockPatient = {
  id: 'patient-1',
  clinicId: 'clinic-1',
  name: 'João Silva',
  email: 'joao@test.com',
  phone: null,
  birthDate: null,
  cpf: null,
  address: null,
  notes: null,
  sessionPrice: null,
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  clinic: { findUnique: jest.fn() },
  patient: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PatientsService', () => {
  let service: PatientsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(PatientsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a patient', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.create.mockResolvedValue(mockPatient);

      const result = await service.create('user-1', { name: 'João Silva' });

      expect(result).toEqual(mockPatient);
      expect(prismaMock.patient.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ clinicId: 'clinic-1' }) }),
      );
    });

    it('should throw ForbiddenException when clinic not found', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(null);
      await expect(service.create('user-1', { name: 'Test' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return a patient', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.findFirst.mockResolvedValue(mockPatient);

      const result = await service.findOne('user-1', 'patient-1');
      expect(result).toEqual(mockPatient);
    });

    it('should throw NotFoundException when patient not found', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a patient', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.findFirst.mockResolvedValue(mockPatient);
      prismaMock.patient.update.mockResolvedValue({ ...mockPatient, deletedAt: new Date() });

      await service.remove('user-1', 'patient-1');

      expect(prismaMock.patient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });
});
