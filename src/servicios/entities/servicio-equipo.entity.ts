import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Servicio } from './servicio.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';

@Entity('servicio_equipos')
export class ServicioEquipo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'id_servicio', type: 'int' })
    idServicio: number;

    @Column({ name: 'id_equipo', type: 'int' })
    idEquipo: number;

    @ManyToOne(() => Servicio, (servicio) => servicio.equiposAsignados, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'id_servicio' })
    servicio: Servicio;

    @ManyToOne(() => Equipo)
    @JoinColumn({ name: 'id_equipo' })
    equipo: Equipo;
}
