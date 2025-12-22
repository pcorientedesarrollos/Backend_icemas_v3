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
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Sucursal } from '../../sucursales/entities/sucursal.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Tecnico } from '../../tecnicos/entities/tecnico.entity';
import { TipoServicio } from './tipo-servicio.entity';
import { FotoServicio } from './foto-servicio.entity';
import { ServicioEquipo } from './servicio-equipo.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn({ name: 'id_servicio' })
  idServicio: number;

  @Column({ name: 'id_tecnico', type: 'int' })
  idTecnico: number;

  @Column({ name: 'id_tipo_servicio', type: 'int' })
  idTipoServicio: number;

  @Column({ name: 'id_cliente', type: 'int' })
  idCliente: number;

  @Column({ name: 'id_sucursal', type: 'int' })
  idSucursal: number;

  @Column({ name: 'id_equipo', type: 'int' })
  idEquipo: number;

  @Column({ name: 'fecha_servicio', type: 'date' })
  fechaServicio: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tipo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'detalle_trabajo', type: 'text', nullable: true })
  detalleTrabajo: string;

  @Column({ type: 'varchar', length: 100 })
  folio: string;

  @Column({ type: 'varchar', length: 50 })
  estado: string; // 'Pendiente' | 'Completado' | 'Cancelado'

  @Column({ type: 'varchar', length: 255, nullable: true })
  firma: string;

  @Column({ name: 'firma_tecnico', type: 'varchar', length: 255, nullable: true })
  firmaTecnico: string;

  @Column({ name: 'lastUser_id', type: 'bigint', nullable: true })
  lastUserId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.servicios)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.servicios)
  @JoinColumn({ name: 'id_sucursal' })
  sucursal: Sucursal;

  @ManyToOne(() => Equipo, (equipo) => equipo.servicios)
  @JoinColumn({ name: 'id_equipo' })
  equipo: Equipo;

  @ManyToOne(() => Tecnico, (tecnico) => tecnico.servicios)
  @JoinColumn({ name: 'id_tecnico' })
  tecnico: Tecnico;

  @ManyToOne(() => TipoServicio, (tipo) => tipo.servicios)
  @JoinColumn({ name: 'id_tipo_servicio' })
  tipoServicio: TipoServicio;

  @ManyToOne(() => User, (user) => user.serviciosModified)
  @JoinColumn({ name: 'lastUser_id' })
  lastModifiedBy: User;

  @OneToMany(() => ServicioEquipo, (se) => se.servicio, { cascade: true })
  equiposAsignados: ServicioEquipo[];

  @OneToMany(() => FotoServicio, (foto) => foto.servicio, { cascade: true })
  fotos: FotoServicio[];
}
