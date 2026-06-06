import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../../generated/prisma';

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({ example: 'PIX' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ example: '2024-06-10T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
