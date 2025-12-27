import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Brackets } from 'typeorm';
import { Equipo } from './entities/equipo.entity';
import { Marca } from './entities/marca.entity';
import { TipoEquipo } from './entities/tipo-equipo.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ServicioEquipo } from '../servicios/entities/servicio-equipo.entity';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { CreateTipoEquipoDto } from './dto/create-tipo-equipo.dto';

@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(Equipo)
    private equiposRepository: Repository<Equipo>,
    @InjectRepository(Marca)
    private marcasRepository: Repository<Marca>,
    @InjectRepository(TipoEquipo)
    private tiposRepository: Repository<TipoEquipo>,
    @InjectRepository(Servicio)
    private serviciosRepository: Repository<Servicio>,
    @InjectRepository(ServicioEquipo)
    private servicioEquiposRepository: Repository<ServicioEquipo>,
  ) { }

  // ============= EQUIPOS =============
  async createEquipo(createEquipoDto: CreateEquipoDto) {
    const equipo = this.equiposRepository.create(createEquipoDto);
    return await this.equiposRepository.save(equipo);
  }

  async findAllEquipos(filters?: {
    nombre?: string;
    marca?: string;
    serie?: string;
    tipo?: string;
    cliente?: string;
    estado?: number;
    search?: string;
  }) {
    const query = this.equiposRepository
      .createQueryBuilder('equipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.cliente', 'cliente')
      .leftJoinAndSelect('equipo.sucursal', 'sucursal');

    if (filters?.search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('equipo.nombre LIKE :search', { search: `%${filters.search}%` })
            .orWhere('marca.nombre LIKE :search', { search: `%${filters.search}%` })
            .orWhere('equipo.serie LIKE :search', { search: `%${filters.search}%` })
            .orWhere('tipoEquipo.nombre LIKE :search', { search: `%${filters.search}%` })
            .orWhere('cliente.nombre LIKE :search', { search: `%${filters.search}%` })
            .orWhere('sucursal.nombre LIKE :search', { search: `%${filters.search}%` })
            .orWhere('CAST(equipo.idEquipo AS CHAR) LIKE :search', { search: `%${filters.search}%` });
        }),
      );
    }

    if (filters?.nombre) {
      query.andWhere('equipo.nombre LIKE :nombre', {
        nombre: `%${filters.nombre}%`,
      });
    }
    if (filters?.marca) {
      query.andWhere('marca.nombre LIKE :marca', {
        marca: `%${filters.marca}%`,
      });
    }
    if (filters?.serie) {
      query.andWhere('equipo.serie LIKE :serie', {
        serie: `%${filters.serie}%`,
      });
    }
    if (filters?.tipo) {
      query.andWhere('tipoEquipo.nombre LIKE :tipo', {
        tipo: `%${filters.tipo}%`,
      });
    }
    if (filters?.cliente) {
      query.andWhere('cliente.nombre LIKE :cliente', {
        cliente: `%${filters.cliente}%`,
      });
    }
    if (filters?.estado !== undefined) {
      query.andWhere('equipo.estado = :estado', { estado: filters.estado });
    }

    return await query
      .orderBy('equipo.idEquipo', 'DESC')
      .take(1000)
      .getMany();
  }

  async findOneEquipo(id: number) {
    const equipo = await this.equiposRepository.findOne({
      where: { idEquipo: id },
      relations: ['marca', 'tipoEquipo', 'cliente', 'sucursal', 'servicios'],
    });

    if (!equipo) {
      throw new NotFoundException(`Equipo with ID ${id} not found`);
    }

    return equipo;
  }

  async updateEquipo(id: number, updateEquipoDto: Partial<CreateEquipoDto>) {
    await this.findOneEquipo(id);
    await this.equiposRepository.update({ idEquipo: id }, updateEquipoDto);
    return this.findOneEquipo(id);
  }

  async removeEquipo(id: number, force: boolean = false) {
    const equipo = await this.equiposRepository.findOne({
      where: { idEquipo: id },
      relations: ['servicios'],
    });

    if (!equipo) {
      throw new NotFoundException(`Equipo con ID ${id} no encontrado`);
    }

    // Check servicios with old relation (id_equipo column)
    const serviciosDirectos = equipo.servicios?.length || 0;

    // Check servicios with new relation (servicio_equipos table)
    const serviciosEnTablaRelacion = await this.servicioEquiposRepository.count({
      where: { idEquipo: id },
    });

    const totalServicios = serviciosDirectos + serviciosEnTablaRelacion;

    if (totalServicios > 0 && !force) {
      throw new BadRequestException(
        `No se puede eliminar este equipo porque tiene ${totalServicios} servicio(s) asociado(s). Primero elimina los servicios relacionados.`,
      );
    }

    // If force = true, delete all associated servicios first
    if (force && totalServicios > 0) {
      // Delete from servicio_equipos table
      await this.servicioEquiposRepository.delete({ idEquipo: id });

      // Delete servicios where id_equipo = id
      if (serviciosDirectos > 0) {
        await this.serviciosRepository.delete({ idEquipo: id });
      }
    }

    await this.equiposRepository.remove(equipo);
    return {
      message: 'Equipo eliminado correctamente',
      serviciosEliminados: force ? totalServicios : 0
    };
  }

  async autocompleteNombre(term: string) {
    const equipos = await this.equiposRepository.find({
      where: { nombre: Like(`%${term}%`) },
      select: ['nombre'],
      take: 10,
    });
    return [...new Set(equipos.map((e) => e.nombre))];
  }

  async autocompleteSerie(term: string) {
    const equipos = await this.equiposRepository.find({
      where: { serie: Like(`%${term}%`) },
      select: ['serie'],
      take: 10,
    });
    return [...new Set(equipos.map((e) => e.serie).filter((s) => s))];
  }

  async porSucursal(idSucursal: number) {
    return await this.equiposRepository.find({
      where: { idSucursal },
      relations: ['marca', 'tipoEquipo'],
    });
  }

  // ============= MARCAS =============
  async createMarca(createMarcaDto: CreateMarcaDto) {
    const marca = this.marcasRepository.create(createMarcaDto);
    return await this.marcasRepository.save(marca);
  }

  async findAllMarcas() {
    return await this.marcasRepository.find({ order: { idMarca: 'DESC' } });
  }

  async findOneMarca(id: number) {
    const marca = await this.marcasRepository.findOne({
      where: { idMarca: id },
    });
    if (!marca) {
      throw new NotFoundException(`Marca with ID ${id} not found`);
    }
    return marca;
  }

  async updateMarca(id: number, updateMarcaDto: Partial<CreateMarcaDto>) {
    await this.findOneMarca(id);
    await this.marcasRepository.update({ idMarca: id }, updateMarcaDto);
    return this.findOneMarca(id);
  }

  async removeMarca(id: number) {
    const marca = await this.marcasRepository.findOne({
      where: { idMarca: id },
      relations: ['equipos'],
    });

    if (!marca) {
      throw new NotFoundException(`Marca with ID ${id} not found`);
    }

    if (marca.equipos && marca.equipos.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar la marca "${marca.nombre}" porque tiene ${marca.equipos.length} equipo(s) asociado(s)`,
      );
    }

    await this.marcasRepository.remove(marca);
    return { message: 'Marca deleted successfully' };
  }

  async checkNombreMarca(nombre: string) {
    const exists = await this.marcasRepository.exist({ where: { nombre } });
    return { exists };
  }

  // ============= TIPOS EQUIPO =============
  async createTipo(createTipoDto: CreateTipoEquipoDto) {
    const tipo = this.tiposRepository.create(createTipoDto);
    return await this.tiposRepository.save(tipo);
  }

  async findAllTipos() {
    return await this.tiposRepository.find({ order: { idTipo: 'DESC' } });
  }

  async findOneTipo(id: number) {
    const tipo = await this.tiposRepository.findOne({ where: { idTipo: id } });
    if (!tipo) {
      throw new NotFoundException(`TipoEquipo with ID ${id} not found`);
    }
    return tipo;
  }

  async updateTipo(id: number, updateTipoDto: Partial<CreateTipoEquipoDto>) {
    await this.findOneTipo(id);
    await this.tiposRepository.update({ idTipo: id }, updateTipoDto);
    return this.findOneTipo(id);
  }

  async removeTipo(id: number) {
    const tipo = await this.findOneTipo(id);
    await this.tiposRepository.remove(tipo);
    return { message: 'Tipo Equipo deleted successfully' };
  }

  async checkNombreTipo(nombre: string) {
    const exists = await this.tiposRepository.exist({ where: { nombre } });
    return { exists };
  }

  // ============= SERVICIOS POR EQUIPO =============
  async getServicios(id: number) {
    // First verify equipo exists
    await this.findOneEquipo(id);

    // Get all services where this equipo appears (either as primary or additional)
    const servicios = await this.serviciosRepository
      .createQueryBuilder('servicio')
      .leftJoinAndSelect('servicio.equipo', 'equipo')
      .leftJoinAndSelect('servicio.tecnico', 'tecnico')
      .leftJoinAndSelect('servicio.tipoServicio', 'tipoServicio')
      .leftJoinAndSelect('servicio.cliente', 'cliente')
      .leftJoinAndSelect('servicio.sucursal', 'sucursal')
      .leftJoinAndSelect('servicio.equiposAsignados', 'equiposAsignados')
      .leftJoinAndSelect('equiposAsignados.equipo', 'equipoAsignado')
      .where('servicio.idEquipo = :id', { id })
      .orWhere('equiposAsignados.idEquipo = :id', { id })
      .orderBy('servicio.fechaServicio', 'DESC')
      .getMany();

    return servicios;
  }

  // Get servicios asociados for deletion confirmation
  async getServiciosAsociadosParaEliminacion(id: number) {
    await this.findOneEquipo(id);

    // Get servicios with old relation (id_equipo)
    const serviciosDirectos = await this.serviciosRepository
      .createQueryBuilder('servicio')
      .leftJoinAndSelect('servicio.cliente', 'cliente')
      .leftJoinAndSelect('servicio.sucursal', 'sucursal')
      .leftJoinAndSelect('servicio.tecnico', 'tecnico')
      .where('servicio.idEquipo = :id', { id })
      .select([
        'servicio.idServicio',
        'servicio.folio',
        'servicio.fechaServicio',
        'servicio.estado',
        'cliente.nombre',
        'cliente.empresa',
        'sucursal.nombre',
        'tecnico.nombre'
      ])
      .getMany();

    // Get servicios from servicio_equipos table
    const serviciosRelacion = await this.servicioEquiposRepository
      .createQueryBuilder('se')
      .leftJoinAndSelect('se.servicio', 'servicio')
      .leftJoinAndSelect('servicio.cliente', 'cliente')
      .leftJoinAndSelect('servicio.sucursal', 'sucursal')
      .leftJoinAndSelect('servicio.tecnico', 'tecnico')
      .where('se.idEquipo = :id', { id })
      .select([
        'se.id',
        'servicio.idServicio',
        'servicio.folio',
        'servicio.fechaServicio',
        'servicio.estado',
        'cliente.nombre',
        'cliente.empresa',
        'sucursal.nombre',
        'tecnico.nombre'
      ])
      .getMany();

    // Combine and deduplicate
    const allServicios = [...serviciosDirectos, ...serviciosRelacion.map(sr => sr.servicio)];
    const uniqueServicios = Array.from(
      new Map(allServicios.map(s => [s.idServicio, s])).values()
    );

    return {
      count: uniqueServicios.length,
      servicios: uniqueServicios.map(s => ({
        idServicio: s.idServicio,
        folio: s.folio,
        fechaServicio: s.fechaServicio,
        estado: s.estado,
        cliente: s.cliente?.nombre || s.cliente?.empresa || '',
        sucursal: s.sucursal?.nombre || '',
        tecnico: s.tecnico?.nombre || ''
      }))
    };
  }
}
