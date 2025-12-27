import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from './entities/sucursal.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Sucursal)
    private sucursalesRepository: Repository<Sucursal>,
    @InjectRepository(Servicio)
    private serviciosRepository: Repository<Servicio>,
  ) { }

  async create(createSucursalDto: CreateSucursalDto) {
    const sucursal = this.sucursalesRepository.create(createSucursalDto);
    return await this.sucursalesRepository.save(sucursal);
  }

  async findAll(idCliente?: number) {
    const where = idCliente ? { idCliente } : {};
    return await this.sucursalesRepository.find({
      where,
      relations: ['cliente'],
      order: { idSucursal: 'DESC' },
    });
  }

  async findOne(id: number) {
    const sucursal = await this.sucursalesRepository.findOne({
      where: { idSucursal: id },
      relations: ['cliente', 'equipos'],
    });

    if (!sucursal) {
      throw new NotFoundException(`Sucursal with ID ${id} not found`);
    }

    return sucursal;
  }

  async update(id: number, updateSucursalDto: UpdateSucursalDto) {
    await this.findOne(id);
    await this.sucursalesRepository.update(
      { idSucursal: id },
      updateSucursalDto,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    const sucursal = await this.findOne(id);
    await this.sucursalesRepository.remove(sucursal);
    return { message: 'Sucursal deleted successfully' };
  }

  async getEquipos(id: number) {
    const sucursal = await this.sucursalesRepository.findOne({
      where: { idSucursal: id },
      relations: ['equipos'],
    });

    if (!sucursal) {
      throw new NotFoundException(`Sucursal with ID ${id} not found`);
    }

    return sucursal.equipos;
  }

  async porCliente(idCliente: number) {
    return await this.sucursalesRepository.find({
      where: { idCliente },
      order: { nombre: 'ASC' },
    });
  }

  async getServicios(id: number) {
    // First verify sucursal exists
    await this.findOne(id);

    // Get all services where the equipo belongs to this sucursal
    return await this.serviciosRepository.find({
      where: { equipo: { idSucursal: id } },
      relations: ['equipo', 'tecnico', 'tipoServicio', 'cliente'],
      order: { fechaServicio: 'DESC' },
    });
  }
}
