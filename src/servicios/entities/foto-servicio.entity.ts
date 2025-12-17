import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Servicio } from './servicio.entity';

@Entity('fotos_servicio')
export class FotoServicio {
    @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
    id: number;

    @Column({ name: 'id_servicio', type: 'int' })
    idServicio: number;

    @Column({ type: 'varchar', length: 255 })
    imagen: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => Servicio, servicio => servicio.fotos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_servicio' })
    servicio: Servicio;
}
