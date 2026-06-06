import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsDecimal,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'Telefone inválido' })
  phone?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Encaminhado por Dr. Roberto' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '200.00' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  sessionPrice?: string;
}
