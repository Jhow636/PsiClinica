import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RecordsService } from './records.service';
import { UpdateAnamnesisDto } from './dto/update-anamnesis.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

@ApiTags('records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('records')
export class RecordsController {
  constructor(private records: RecordsService) {}

  @Get(':patientId')
  @ApiOperation({ summary: 'Obter ou criar prontuário do paciente' })
  getOrCreate(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.records.getOrCreateRecord(user.id, patientId);
  }

  @Patch(':patientId/anamnesis')
  @ApiOperation({ summary: 'Atualizar anamnese' })
  updateAnamnesis(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Body() dto: UpdateAnamnesisDto,
  ) {
    return this.records.updateAnamnesis(user.id, patientId, dto);
  }

  @Post(':patientId/notes')
  @ApiOperation({ summary: 'Criar anotação de sessão' })
  createNote(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.records.createNote(user.id, patientId, dto);
  }

  @Put(':patientId/notes/:noteId')
  @ApiOperation({ summary: 'Atualizar anotação de sessão' })
  updateNote(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.records.updateNote(user.id, patientId, noteId, dto);
  }

  @Delete(':patientId/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar anotação de sessão' })
  deleteNote(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.records.deleteNote(user.id, patientId, noteId);
  }

  @Get(':patientId/export/pdf')
  @ApiOperation({ summary: 'Exportar prontuário em PDF' })
  async exportPdf(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Res() res: Response,
  ) {
    const bytes = await this.records.exportPdf(user.id, patientId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prontuario-${patientId}.pdf"`);
    res.end(Buffer.from(bytes));
  }
}
