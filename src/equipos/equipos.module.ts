import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipo } from './entities/equipo.entity';
import { Marca } from './entities/marca.entity';
import { TipoEquipo } from './entities/tipo-equipo.entity';
import { EquiposController } from './equipos.controller';
import { EquiposService } from './equipos.service';

@Module({
    imports: [TypeOrmModule.forFeature([Equipo, Marca, TipoEquipo])],
    controllers: [EquiposController],
    providers: [EquiposService],
    exports: [EquiposService],
})
export class EquiposModule { }
