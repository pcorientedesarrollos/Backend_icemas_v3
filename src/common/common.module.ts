import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FotoServicio } from '../servicios/entities/foto-servicio.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { UploadService } from './services/upload.service';
import { PdfService } from './services/pdf.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([FotoServicio, Servicio])],
  providers: [UploadService, PdfService],
  exports: [UploadService, PdfService],
})
export class CommonModule {}
