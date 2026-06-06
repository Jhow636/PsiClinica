import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  patientId: string;

  @ApiProperty({ example: '2024-06-10T10:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-06-10T11:00:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: 'Sessão inicial de avaliação' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: 'FREQ=WEEKLY;BYDAY=MO' })
  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}
