import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    let folio = createServicioDto.folio;
    if (!folio) {
      folio = await this.generateFolio();
    }

    const servicio = this.serviciosRepository.create({
      ...createServicioDto,
      folio,
      lastUserId: userId, // Audit trail
    });
    return await this.serviciosRepository.save(servicio);
  }

  private async generateFolio(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `SRV-${year}${month}-`;

    const lastService = await this.serviciosRepository
      .createQueryBuilder('servicio')
      .where('servicio.folio LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('servicio.folio', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastService) {
      const parts = lastService.folio.split('-');
      // Expected format: SRV-YYYYMM-XXXX or SRV-YYYYMM-XXXXX
      const lastSequence = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(5, '0')}`;
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
    const query = this.serviciosRepository
      .createQueryBuilder('servicio')
      .leftJoinAndSelect('servicio.cliente', 'cliente')
      .leftJoinAndSelect('servicio.sucursal', 'sucursal')
      .leftJoinAndSelect('servicio.equipo', 'equipo')
      .leftJoinAndSelect('servicio.tecnico', 'tecnico')
      .leftJoinAndSelect('servicio.tipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.lastModifiedBy', 'user');

    if (filters?.idServicio) {
      query.andWhere('servicio.idServicio = :idServicio', {
        idServicio: filters.idServicio,
      });
    }
    if (filters?.fechaInicio && filters?.fechaFin) {
      query.andWhere('servicio.fechaServicio BETWEEN :inicio AND :fin', {
        inicio: filters.fechaInicio,
        fin: filters.fechaFin,
      });
    }
    if (filters?.cliente) {
      query.andWhere('cliente.nombre LIKE :cliente', {
        cliente: `%${filters.cliente}%`,
      });
    }
    if (filters?.equipo) {
      query.andWhere('equipo.nombre LIKE :equipo', {
        equipo: `%${filters.equipo}%`,
      });
    }
    if (filters?.serie) {
      query.andWhere('equipo.serie LIKE :serie', {
        serie: `%${filters.serie}%`,
      });
    }
    if (filters?.estado) {
      query.andWhere('servicio.estado = :estado', { estado: filters.estado });
    }
    if (filters?.detalle) {
      query.andWhere('servicio.detalleTrabajo LIKE :detalle', {
        detalle: `%${filters.detalle}%`,
      });
    }

    return await query
      .orderBy('servicio.fechaServicio', 'DESC')
      .take(1000)
      .getMany();
  }

  async findOne(id: number) {
    const servicio = await this.serviciosRepository.findOne({
      where: { idServicio: id },
      relations: [
        'cliente',
        'sucursal',
        'equipo',
        'tecnico',
        'tipoServicio',
        'lastModifiedBy',
        'fotos',
      ],
    });

    if (!servicio) {
      throw new NotFoundException(`Servicio with ID ${id} not found`);
    }

    // Convert firma file to base64 if it exists
    if (servicio.firma) {
      try {
        const firmaPath = path.join(process.cwd(), 'uploads', 'firmas', servicio.firma);
        if (fs.existsSync(firmaPath)) {
          const buffer = fs.readFileSync(firmaPath);
          const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
          servicio.firma = base64;
        }
      } catch (error) {
        // If file doesn't exist or can't be read, keep the filename
        console.error(`Error reading firma file: ${error.message}`);
      }
    }

    // Convert photo files to base64 if they exist
    if (servicio.fotos && servicio.fotos.length > 0) {
      servicio.fotos = servicio.fotos.map((foto) => {
        try {
          const fotoPath = path.join(process.cwd(), 'uploads', 'fotos_servicio', foto.imagen);
          if (fs.existsSync(fotoPath)) {
            const buffer = fs.readFileSync(fotoPath);
            const extension = path.extname(foto.imagen).toLowerCase();
            const mimeType = extension === '.png' ? 'image/png' : 'image/jpeg';
            const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
            return { ...foto, url: base64, tipo: foto.tipo || 'antes' };
          }
        } catch (error) {
          console.error(`Error reading foto file: ${error.message}`);
        }
        return foto;
      });
    }

    return servicio;
  }

  async update(
    id: number,
    updateServicioDto: Partial<CreateServicioDto>,
    userId: number,
  ) {
    await this.findOne(id);

    // Extract fotos and firma from the DTO (they need special handling)
    const { fotos, firma, ...servicioData } = updateServicioDto as any;

    // Update the basic servicio fields
    await this.serviciosRepository.update(
      { idServicio: id },
      { ...servicioData, lastUserId: userId },
    );

    // Handle firma separately if provided
    if (firma) {
      await this.serviciosRepository.update(
        { idServicio: id },
        { firma },
      );
    }

    // Handle fotos separately if provided
    if (fotos && Array.isArray(fotos)) {
      // TODO: Implement photo handling
      // For now, we'll skip this as photos need a separate endpoint
      // to handle file uploads properly
    }

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
      throw new BadRequestException(
        'Invalid signature format. Must be base64 PNG.',
      );
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
    await this.serviciosRepository.update(
      { idServicio: id },
      { firma: filename },
    );

    return { success: true, message: 'Firma guardada correctamente', filename };
  }

  // Tipos de Servicio
  async findAllTiposServicio() {
    return await this.tiposServicioRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async createTipoServicio(nombre: string, descripcion?: string) {
    const tipo = this.tiposServicioRepository.create({ nombre, descripcion });
    return await this.tiposServicioRepository.save(tipo);
  }

  async findOneTipoServicio(id: number) {
    const tipo = await this.tiposServicioRepository.findOne({
      where: { idTipoServicio: id },
    });
    if (!tipo) {
      throw new NotFoundException(`TipoServicio with ID ${id} not found`);
    }
    return tipo;
  }

  async updateTipoServicio(
    id: number,
    data: { nombre?: string; descripcion?: string },
  ) {
    await this.findOneTipoServicio(id);
    await this.tiposServicioRepository.update({ idTipoServicio: id }, data);
    return this.findOneTipoServicio(id);
  }

  async removeTipoServicio(id: number) {
    const tipo = await this.findOneTipoServicio(id);
    await this.tiposServicioRepository.remove(tipo);
    return { message: 'Tipo de servicio deleted successfully' };
  }

  async checkFolio(folio: string, excludeId?: number) {
    const query = this.serviciosRepository
      .createQueryBuilder('servicio')
      .where('servicio.folio = :folio', { folio });

    if (excludeId) {
      query.andWhere('servicio.idServicio != :excludeId', { excludeId });
    }

    const exists = (await query.getCount()) > 0;
    return { exists };
  }

  async checkNombreTipoServicio(nombre: string) {
    const exists = await this.tiposServicioRepository.exist({
      where: { nombre },
    });
    return { exists };
  }

  // Autocomplete methods
  async autocompleteId(term: string) {
    if (!term || term.length < 2) {
      return [];
    }

    const servicios = await this.serviciosRepository
      .createQueryBuilder('servicio')
      .leftJoinAndSelect('servicio.cliente', 'cliente')
      .leftJoinAndSelect('servicio.equipo', 'equipo')
      .where('servicio.folio LIKE :term', { term: `%${term}%` })
      .orWhere('CAST(servicio.idServicio AS CHAR) LIKE :term', {
        term: `%${term}%`,
      })
      .orWhere('cliente.nombre LIKE :term', { term: `%${term}%` })
      .orWhere('equipo.nombre LIKE :term', { term: `%${term}%` })
      .orderBy('servicio.fechaServicio', 'DESC')
      .limit(10)
      .getMany();

    return servicios.map((s) => ({
      id: s.idServicio,
      label: `#${s.folio} - ${s.cliente?.nombre || 'Sin cliente'}`,
      subtitle: s.equipo?.nombre || s.estado,
    }));
  }

  async autocompleteCliente(term: string) {
    if (!term || term.length < 2) {
      return [];
    }

    const servicios = await this.serviciosRepository
      .createQueryBuilder('servicio')
      .leftJoinAndSelect('servicio.cliente', 'cliente')
      .where('cliente.nombre LIKE :term', { term: `%${term}%` })
      .select('DISTINCT cliente.nombre', 'nombre')
      .limit(10)
      .getRawMany();

    return servicios.map((s) => s.nombre);
  }
}
