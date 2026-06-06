import { Test } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '../../generated/prisma';

const mockClinic = { id: 'clinic-1', userId: 'user-1' };
const mockAppointment = { id: 'appt-1', userId: 'user-1', patientId: 'patient-1' };
const mockPayment = {
  id: 'pay-1',
  appointmentId: 'appt-1',
  patientId: 'patient-1',
  amount: '150.00',
  status: PaymentStatus.PAID,
  method: 'PIX',
  paidAt: new Date('2024-06-10T10:00:00.000Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  clinic: { findUnique: jest.fn() },
  appointment: { findFirst: jest.fn() },
  payment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('FinancesService', () => {
  let service: FinancesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FinancesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(FinancesService);
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return correct summary structure', async () => {
      prismaMock.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: '300.00' } })
        .mockResolvedValueOnce({ _sum: { amount: '150.00' } });
      prismaMock.payment.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      const result = await service.getSummary('user-1');

      expect(result).toHaveProperty('totalPaid');
      expect(result).toHaveProperty('totalPending');
      expect(result).toHaveProperty('countPaid');
      expect(result).toHaveProperty('countPending');
      expect(result).toHaveProperty('countCancelled');
      expect(result.countPaid).toBe(2);
      expect(result.countPending).toBe(1);
      expect(result.countCancelled).toBe(0);
    });
  });

  describe('create', () => {
    it('should throw ConflictException when payment already exists for appointmentId', async () => {
      prismaMock.clinic.findUnique.mockResolvedValue(mockClinic);
      prismaMock.appointment.findFirst.mockResolvedValue(mockAppointment);
      prismaMock.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        service.create('user-1', {
          appointmentId: 'appt-1',
          amount: '150.00',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should auto-set paidAt when status changes to PAID', async () => {
      const paymentPending = { ...mockPayment, status: PaymentStatus.PENDING, paidAt: null };
      prismaMock.payment.findFirst.mockResolvedValue(paymentPending);
      prismaMock.payment.update.mockResolvedValue({ ...paymentPending, status: PaymentStatus.PAID, paidAt: new Date() });

      const result = await service.updateStatus('user-1', 'pay-1', {
        status: PaymentStatus.PAID,
      });

      expect(prismaMock.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.PAID,
            paidAt: expect.any(Date),
          }),
        }),
      );
      expect(result.status).toBe(PaymentStatus.PAID);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when payment is not found', async () => {
      prismaMock.payment.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
