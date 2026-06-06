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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinancesService } from './finances.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

@ApiTags('finances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finances')
export class FinancesController {
  constructor(private finances: FinancesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar pagamento' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.finances.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pagamentos' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListPaymentsDto) {
    return this.finances.findAll(user.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro do mês atual' })
  getSummary(@CurrentUser() user: AuthUser) {
    return this.finances.getSummary(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.finances.findOne(user.id, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do pagamento' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.finances.updateStatus(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir pagamento' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.finances.remove(user.id, id);
  }
}
