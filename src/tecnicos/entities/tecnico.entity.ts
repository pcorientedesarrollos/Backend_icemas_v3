import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Servicio } from '../../servicios/entities/servicio.entity';

@Entity('tecnicos')
export class Tecnico {
  @PrimaryGeneratedColumn({ name: 'id_tecnico' })
  idTecnico: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  especialidad: string;

  @Column({ type: 'tinyint', width: 1 })
  activo: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firma: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Servicio, (servicio) => servicio.tecnico)
  servicios: Servicio[];
}
