import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ListPatientsDto } from './dto/list-patients.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private patients: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar paciente' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePatientDto) {
    return this.patients.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pacientes' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListPatientsDto) {
    return this.patients.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar paciente por ID' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patients.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar paciente' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patients.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover paciente (soft delete)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patients.remove(user.id, id);
  }
}
