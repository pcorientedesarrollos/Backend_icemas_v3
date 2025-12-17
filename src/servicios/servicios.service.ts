import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { TipoServicio } from './entities/tipo-servicio.entity';
import { FotoServicio } from './entities/foto-servicio.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { SaveSignatureDto } from './dto/save-signature.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ServiciosService {
    constructor(
        @InjectRepository(Servicio)
        private serviciosRepository: Repository<Servicio>,
        @InjectRepository(TipoServicio)
        private tiposServicioRepository: Repository<TipoServicio>,
        @InjectRepository(FotoServicio)
        private fotosRepository: Repository<FotoServicio>,
    ) { }

    async create(createServicioDto: CreateServicioDto, userId: number) {
        const servicio = this.serviciosRepository.create({
            ...createServicioDto,
            lastUserId: userId, // Audit trail
        });
        return await this.serviciosRepository.save(servicio);
    }

    async findAll(filters?: {
        idServicio?: number;
        fechaInicio?: string;
        fechaFin?: string;
        cliente?: string;
        equipo?: string;
        serie?: string;
        estado?: string;
        detalle?: string;
    }) {
        const query = this.serviciosRepository.createQueryBuilder('servicio')
            .leftJoinAndSelect('servicio.cliente', 'cliente')
            .leftJoinAndSelect('servicio.sucursal', 'sucursal')
            .leftJoinAndSelect('servicio.equipo', 'equipo')
            .leftJoinAndSelect('servicio.tecnico', 'tecnico')
            .leftJoinAndSelect('servicio.tipoServicio', 'tipoServicio')
            .leftJoinAndSelect('servicio.lastModifiedBy', 'user');

        if (filters?.idServicio) {
            query.andWhere('servicio.idServicio = :idServicio', { idServicio: filters.idServicio });
        }
        if (filters?.fechaInicio && filters?.fechaFin) {
            query.andWhere('servicio.fechaServicio BETWEEN :inicio AND :fin', {
                inicio: filters.fechaInicio,
                fin: filters.fechaFin,
            });
        }
        if (filters?.cliente) {
            query.andWhere('cliente.nombre LIKE :cliente', { cliente: `%${filters.cliente}%` });
        }
        if (filters?.equipo) {
            query.andWhere('equipo.nombre LIKE :equipo', { equipo: `%${filters.equipo}%` });
        }
        if (filters?.serie) {
            query.andWhere('equipo.serie LIKE :serie', { serie: `%${filters.serie}%` });
        }
        if (filters?.estado) {
            query.andWhere('servicio.estado = :estado', { estado: filters.estado });
        }
        if (filters?.detalle) {
            query.andWhere('servicio.detalleTrabajo LIKE :detalle', { detalle: `%${filters.detalle}%` });
        }

        return await query
            .orderBy('servicio.fechaServicio', 'DESC')
            .take(25)
            .getMany();
    }

    async findOne(id: number) {
        const servicio = await this.serviciosRepository.findOne({
            where: { idServicio: id },
            relations: ['cliente', 'sucursal', 'equipo', 'tecnico', 'tipoServicio', 'lastModifiedBy', 'fotos'],
        });

        if (!servicio) {
            throw new NotFoundException(`Servicio with ID ${id} not found`);
        }

        return servicio;
    }

    async update(id: number, updateServicioDto: Partial<CreateServicioDto>, userId: number) {
        await this.findOne(id);
        await this.serviciosRepository.update(
            { idServicio: id },
            { ...updateServicioDto, lastUserId: userId }
        );
        return this.findOne(id);
    }

    async remove(id: number) {
        const servicio = await this.findOne(id);
        await this.serviciosRepository.remove(servicio);
        return { message: 'Servicio deleted successfully' };
    }

    // Estado filters
    async findByEstado(estado: string) {
        return await this.serviciosRepository.find({
            where: { estado },
            relations: ['cliente', 'equipo', 'tecnico'],
            order: { fechaServicio: 'DESC' },
            take: 50,
        });
    }

    // Signature handling
    async saveSignature(id: number, saveSignatureDto: SaveSignatureDto) {
        const { signature } = saveSignatureDto;

        // Validate base64 PNG format
        if (!signature.startsWith('data:image/png;base64,')) {
            throw new BadRequestException('Invalid signature format. Must be base64 PNG.');
        }

        // Extract base64 data
        const base64Data = signature.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'firmas');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Save file
        const filename = `firma_${id}_${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, buffer);

        // Update servicio
        await this.serviciosRepository.update({ idServicio: id }, { firma: filename });

        return { success: true, message: 'Firma guardada correctamente', filename };
    }

    // Autocomplete methods
    async autocompleteId(term: string) {
        const servicios = await this.serviciosRepository.find({
            where: [
                { folio: Like(`%${term}%`) },
            ],
            select: ['idServicio', 'folio'],
            take: 10,
        });
        return servicios.map(s => ({ id: s.idServicio, folio: s.folio }));
    }

    async autocompleteCliente(term: string) {
        const servicios = await this.serviciosRepository.createQueryBuilder('servicio')
            .leftJoin('servicio.cliente', 'cliente')
            .where('cliente.nombre LIKE :term', { term: `%${term}%` })
            .select(['cliente.nombre'])
            .distinct(true)
            .take(10)
            .getRawMany();
        return servicios.map(s => s.cliente_nombre);
    }

    // Tipos de Servicio
    async findAllTiposServicio() {
        return await this.tiposServicioRepository.find({ order: { nombre: 'ASC' } });
    }

    async createTipoServicio(nombre: string, descripcion?: string) {
        const tipo = this.tiposServicioRepository.create({ nombre, descripcion });
        return await this.tiposServicioRepository.save(tipo);
    }
}
