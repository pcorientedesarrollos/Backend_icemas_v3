import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Equipo } from './equipo.entity';

@Entity('tipos_equipo')
export class TipoEquipo {
    @PrimaryGeneratedColumn({ name: 'id_tipo' })
    idTipo: number;

    @Column({ type: 'varchar', length: 255 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @OneToMany(() => Equipo, equipo => equipo.tipoEquipo)
    equipos: Equipo[];
}
