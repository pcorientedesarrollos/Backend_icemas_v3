import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Sucursal } from '../../sucursales/entities/sucursal.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';

@Entity('clientes')
export class Cliente {
    @PrimaryGeneratedColumn({ name: 'id_cliente' })
    idCliente: number;

    @Column({ type: 'varchar', length: 255 })
    nombre: string;

    @Column({ type: 'varchar', length: 255 })
    empresa: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telefono: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @OneToMany(() => Sucursal, sucursal => sucursal.cliente)
    sucursales: Sucursal[];

    @OneToMany(() => Equipo, equipo => equipo.cliente)
    equipos: Equipo[];

    @OneToMany(() => Servicio, servicio => servicio.cliente)
    servicios: Servicio[];
}
