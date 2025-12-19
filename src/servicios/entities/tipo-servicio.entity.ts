import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Servicio } from './servicio.entity';

@Entity('tipos_servicio')
export class TipoServicio {
  @PrimaryGeneratedColumn({ name: 'id_tipo_servicio' })
  idTipoServicio: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Servicio, (servicio) => servicio.tipoServicio)
  servicios: Servicio[];
}
