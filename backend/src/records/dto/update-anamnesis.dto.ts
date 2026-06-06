import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAnamnesisDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  anamnesis?: string;
}
