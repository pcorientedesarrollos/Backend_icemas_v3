import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { TipoServicio } from './entities/tipo-servicio.entity';
import { FotoServicio } from './entities/foto-servicio.entity';
import { ServicioEquipo } from './entities/servicio-equipo.entity';
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
    @InjectRepository(ServicioEquipo)
    private servicioEquipoRepository: Repository<ServicioEquipo>,
  ) { }

  async create(createServicioDto: CreateServicioDto, userId: number) {
    let folio = createServicioDto.folio;
    if (!folio) {
      folio = await this.generateFolio();
    }

    // Extract idsEquipos from DTO
    const { idsEquipos, ...servicioData } = createServicioDto;

    const servicio = this.serviciosRepository.create({
      ...servicioData,
      folio,
      lastUserId: userId,
    });

    const savedServicio = await this.serviciosRepository.save(servicio);

    // Create equipment relations if provided
    if (idsEquipos && idsEquipos.length > 0) {
      const equiposAsignados = idsEquipos.map(idEquipo => ({
        idServicio: savedServicio.idServicio,
        idEquipo,
      }));
      await this.servicioEquipoRepository.save(equiposAsignados);
    }

    return savedServicio;
  }

  private async generateFolio(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Solo últimos 2 dígitos del año
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
      // Expected format: SRV-YYMM-XXX
      const lastSequence = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(3, '0')}`; // 3 dígitos para el consecutivo
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
    search?: string;
  }) {
    const query = this.serviciosRepository
      .createQueryBuilder('servicio')
      .leftJoinAndSelect('servicio.cliente', 'cliente')
      .leftJoinAndSelect('servicio.sucursal', 'sucursal')
      .leftJoinAndSelect('servicio.equipo', 'equipo')
      .leftJoinAndSelect('servicio.tecnico', 'tecnico')
      .leftJoinAndSelect('servicio.equiposAsignados', 'equiposAsignados')
      .leftJoinAndSelect('equiposAsignados.equipo', 'equipoAsignado')
      .leftJoinAndSelect('equipoAsignado.marca', 'marcaAsignada')
      .leftJoinAndSelect('servicio.tipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.lastModifiedBy', 'user');

    if (filters?.search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('servicio.folio LIKE :search', { search: `%${filters.search}%` })
            .orWhere('cliente.nombre LIKE :search', { search: `%${filters.search}%` })
            .orWhere('sucursal.nombre LIKE :search', { search: `%${filters.search}%` })
            .orWhere('equipo.nombre LIKE :search', { search: `%${filters.search}%` })
            .orWhere('equipo.serie LIKE :search', { search: `%${filters.search}%` })
            .orWhere('servicio.detalleTrabajo LIKE :search', { search: `%${filters.search}%` });
        }),
      );
    }

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
        'equiposAsignados',
        'equiposAsignados.equipo',
        'equiposAsignados.equipo.marca',
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

    // Convert firma tecnico file to base64 if it exists
    if (servicio.firmaTecnico) {
      try {
        const firmaPath = path.join(process.cwd(), 'uploads', 'firmas', servicio.firmaTecnico);
        if (fs.existsSync(firmaPath)) {
          const buffer = fs.readFileSync(firmaPath);
          const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
          servicio.firmaTecnico = base64;
        }
      } catch (error) {
        // If file doesn't exist or can't be read, keep the filename
        console.error(`Error reading firma tecnico file: ${error.message}`);
      }
    }

    // Convert technician's profile signature to base64 if it exists
    if (servicio.tecnico && servicio.tecnico.firma) {
      try {
        const firmaPath = path.join(process.cwd(), 'uploads', 'firmas_tecnicos', servicio.tecnico.firma);
        if (fs.existsSync(firmaPath)) {
          const buffer = fs.readFileSync(firmaPath);
          const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
          servicio.tecnico.firma = base64;
        }
      } catch (error) {
        // If file doesn't exist or can't be read, keep the filename
        console.error(`Error reading technician firma file: ${error.message}`);
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

    // Extract fotos, firma, and idsEquipos from the DTO
    const { fotos, firma, idsEquipos, ...servicioData } = updateServicioDto as any;

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

    // Handle equipment relations if provided
    if (idsEquipos && Array.isArray(idsEquipos)) {
      // Delete existing relations
      await this.servicioEquipoRepository.delete({ idServicio: id });

      // Create new relations
      if (idsEquipos.length > 0) {
        const equiposAsignados = idsEquipos.map(idEquipo => ({
          idServicio: id,
          idEquipo,
        }));
        await this.servicioEquipoRepository.save(equiposAsignados);
      }
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

  async saveTechnicianSignature(id: number, saveSignatureDto: SaveSignatureDto) {
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
    const filename = `firma_tecnico_${id}_${Date.now()}.png`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);

    // Update servicio
    await this.serviciosRepository.update(
      { idServicio: id },
      { firmaTecnico: filename },
    );

    return { success: true, message: 'Firma del técnico guardada correctamente', filename };
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
