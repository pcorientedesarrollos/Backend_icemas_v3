import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servicio } from './entities/servicio.entity';
import { FotoServicio } from './entities/foto-servicio.entity';
import { TipoServicio } from './entities/tipo-servicio.entity';
import { ServicioEquipo } from './entities/servicio-equipo.entity';
import { ServiciosController } from './servicios.controller';
import { ServiciosService } from './servicios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Servicio, FotoServicio, TipoServicio, ServicioEquipo])],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [ServiciosService],
})
export class ServiciosModule { }
