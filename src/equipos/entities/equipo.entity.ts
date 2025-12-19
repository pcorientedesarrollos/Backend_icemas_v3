import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Marca } from './marca.entity';
import { TipoEquipo } from './tipo-equipo.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Sucursal } from '../../sucursales/entities/sucursal.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';

@Entity('equipos')
export class Equipo {
  @PrimaryGeneratedColumn({ name: 'id_equipo' })
  idEquipo: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  modelo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'id_marca', type: 'int' })
  idMarca: number;

  @Column({ name: 'id_tipo', type: 'int' })
  idTipo: number;

  @Column({ name: 'id_cliente', type: 'int' })
  idCliente: number;

  @Column({ name: 'id_sucursal', type: 'int' })
  idSucursal: number;

  @Column({ type: 'int' })
  estado: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serie: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Marca, (marca) => marca.equipos)
  @JoinColumn({ name: 'id_marca' })
  marca: Marca;

  @ManyToOne(() => TipoEquipo, (tipo) => tipo.equipos)
  @JoinColumn({ name: 'id_tipo' })
  tipoEquipo: TipoEquipo;

  @ManyToOne(() => Cliente, (cliente) => cliente.equipos)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.equipos)
  @JoinColumn({ name: 'id_sucursal' })
  sucursal: Sucursal;

  @OneToMany(() => Servicio, (servicio) => servicio.equipo)
  servicios: Servicio[];
}
