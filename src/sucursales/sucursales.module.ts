import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sucursal } from './entities/sucursal.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { SucursalesController } from './sucursales.controller';
import { SucursalesService } from './sucursales.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sucursal, Servicio])],
  controllers: [SucursalesController],
  providers: [SucursalesService],
  exports: [SucursalesService],
})
export class SucursalesModule {}
