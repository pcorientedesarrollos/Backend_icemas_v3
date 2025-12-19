import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Servicio } from '../../servicios/entities/servicio.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, default: 'usuario' })
  role: string;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    name: 'remember_token',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  rememberToken: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Servicio, (servicio) => servicio.lastModifiedBy)
  serviciosModified: Servicio[];
}
