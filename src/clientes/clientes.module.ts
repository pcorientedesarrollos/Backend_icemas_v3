import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { Cliente } from './entities/cliente.entity';
import { Servicio } from '../servicios/entities/servicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Servicio])],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
