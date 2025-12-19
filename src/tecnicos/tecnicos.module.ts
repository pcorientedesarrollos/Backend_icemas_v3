import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tecnico } from './entities/tecnico.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { TecnicosController } from './tecnicos.controller';
import { TecnicosService } from './tecnicos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tecnico, Servicio])],
  controllers: [TecnicosController],
  providers: [TecnicosService],
  exports: [TecnicosService],
})
export class TecnicosModule {}
