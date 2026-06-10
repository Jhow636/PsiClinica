import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { PdfService } from './pdf.service';

@Module({
  controllers: [RecordsController],
  providers: [RecordsService, PdfService],
  exports: [RecordsService],
})
export class RecordsModule {}
