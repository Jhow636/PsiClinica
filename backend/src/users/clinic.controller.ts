import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClinicService, UpdateClinicDto } from './clinic.service';

@ApiTags('clinic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clinic')
export class ClinicController {
  constructor(private clinic: ClinicService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil da clínica' })
  getProfile(@CurrentUser() user: { id: string }) {
    return this.clinic.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualizar perfil da clínica' })
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateClinicDto) {
    return this.clinic.updateProfile(user.id, dto);
  }
}
