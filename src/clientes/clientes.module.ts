import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { Cliente } from './entities/cliente.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Equipo } from '../equipos/entities/equipo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Servicio, Equipo])],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule { }
