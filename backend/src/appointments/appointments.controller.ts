import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointments: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar agendamento' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListAppointmentsDto) {
    return this.appointments.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointments.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointments.update(user.id, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.appointments.updateStatus(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover agendamento' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointments.remove(user.id, id);
  }
}
