import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '../../generated/prisma';

const mockClinic = { id: 'clinic-1', userId: 'user-1' };
const mockPatient = { id: 'patient-1', clinicId: 'clinic-1', name: 'João Silva', deletedAt: null };
const mockAppointment = {
  id: 'appt-1',
  userId: 'user-1',
  patientId: 'patient-1',
  startTime: new Date('2024-06-10T10:00:00Z'),
  endTime: new Date('2024-06-10T11:00:00Z'),
  status: AppointmentStatus.SCHEDULED,
  isRecurring: false,
  recurrenceRule: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  patient: { id: 'patient-1', name: 'João Silva', email: null, phone: null },
};

const prismaMock = {
  clinic: { findUnique: jest.fn() },
  patient: { findFirst: jest.fn() },
  appointment: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(AppointmentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an appointment successfully', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.findFirst.mockResolvedValue(mockPatient);
      prismaMock.appointment.create.mockResolvedValue(mockAppointment);

      const dto = {
        patientId: 'patient-1',
        startTime: '2024-06-10T10:00:00.000Z',
        endTime: '2024-06-10T11:00:00.000Z',
      };

      const result = await service.create('user-1', dto);

      expect(result).toEqual(mockAppointment);
      expect(prismaMock.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', patientId: 'patient-1' }),
        }),
      );
    });

    it('should throw NotFoundException when patient does not belong to clinic', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.patient.findFirst.mockResolvedValue(null);

      const dto = {
        patientId: 'other-patient',
        startTime: '2024-06-10T10:00:00.000Z',
        endTime: '2024-06-10T11:00:00.000Z',
      };

      await expect(service.create('user-1', dto)).rejects.toThrow(NotFoundException);
      expect(prismaMock.appointment.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when appointment not found', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status successfully', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue(mockAppointment);
      const updatedAppointment = { ...mockAppointment, status: AppointmentStatus.CONFIRMED };
      prismaMock.appointment.update.mockResolvedValue(updatedAppointment);

      const result = await service.updateStatus('user-1', 'appt-1', {
        status: AppointmentStatus.CONFIRMED,
      });

      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
      expect(prismaMock.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
        data: { status: AppointmentStatus.CONFIRMED },
      });
    });
  });
});
