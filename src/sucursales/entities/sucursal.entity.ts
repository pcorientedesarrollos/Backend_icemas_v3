import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';

@Entity('sucursales')
export class Sucursal {
    @PrimaryGeneratedColumn({ name: 'id_sucursal' })
    idSucursal: number;

    @Column({ name: 'id_cliente', type: 'int' })
    idCliente: number;

    @Column({ type: 'varchar', length: 255 })
    nombre: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    direccion: string;

    @Column({ type: 'varchar', length: 15, nullable: true })
    telefono: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    contacto: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => Cliente, cliente => cliente.sucursales)
    @JoinColumn({ name: 'id_cliente' })
    cliente: Cliente;

    @OneToMany(() => Equipo, equipo => equipo.sucursal)
    equipos: Equipo[];

    @OneToMany(() => Servicio, servicio => servicio.sucursal)
    servicios: Servicio[];
}
