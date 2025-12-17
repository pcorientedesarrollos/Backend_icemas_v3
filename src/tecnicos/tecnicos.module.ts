import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tecnico } from './entities/tecnico.entity';
import { TecnicosController } from './tecnicos.controller';
import { TecnicosService } from './tecnicos.service';

@Module({
    imports: [TypeOrmModule.forFeature([Tecnico])],
    controllers: [TecnicosController],
    providers: [TecnicosService],
    exports: [TecnicosService],
})
export class TecnicosModule { }
