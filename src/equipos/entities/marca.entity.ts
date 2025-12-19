import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Equipo } from './equipo.entity';

@Entity('marcas')
export class Marca {
  @PrimaryGeneratedColumn({ name: 'id_marca' })
  idMarca: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Equipo, (equipo) => equipo.marca)
  equipos: Equipo[];
}
