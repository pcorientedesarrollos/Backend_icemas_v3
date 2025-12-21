import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,
    @InjectRepository(Servicio)
    private serviciosRepository: Repository<Servicio>,
    @InjectRepository(Equipo)
    private equiposRepository: Repository<Equipo>,
  ) { }

  async create(createClienteDto: CreateClienteDto) {
    const cliente = this.clientesRepository.create(createClienteDto);
    return await this.clientesRepository.save(cliente);
  }

  async findAll(search?: string) {
    // If search is provided, filter results
    if (search) {
      return await this.clientesRepository.find({
        where: [
          { nombre: Like(`%${search}%`) },
          { empresa: Like(`%${search}%`) },
          { telefono: Like(`%${search}%`) },
        ],
        relations: ['sucursales'],
        order: { nombre: 'ASC' },
      });
    }

    // Otherwise, return all clientes
    return await this.clientesRepository.find({
      relations: ['sucursales'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const cliente = await this.clientesRepository.findOne({
      where: { idCliente: id },
      relations: ['sucursales'],
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente with ID ${id} not found`);
    }

    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    await this.findOne(id); // Check if exists
    await this.clientesRepository.update({ idCliente: id }, updateClienteDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const cliente = await this.findOne(id);
    await this.clientesRepository.remove(cliente);
    return { message: 'Cliente deleted successfully' };
  }

  async autocomplete(term: string) {
    const clientes = await this.clientesRepository.find({
      where: [
        { nombre: Like(`%${term}%`) },
        { empresa: Like(`%${term}%`) },
        { telefono: Like(`%${term}%`) },
      ],
      take: 10,
    });

    return clientes.map((c) => ({
      id: c.idCliente,
      label: c.nombre,
      subtitle: c.empresa || c.telefono,
    }));
  }

  async checkNombre(nombre: string) {
    const exists = await this.clientesRepository.exist({
      where: { nombre },
    });
    return { exists };
  }

  async getSucursales(id: number) {
    const cliente = await this.clientesRepository.findOne({
      where: { idCliente: id },
      relations: ['sucursales'],
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente with ID ${id} not found`);
    }

    return cliente.sucursales;
  }

  async getServicios(id: number) {
    // First verify cliente exists
    await this.findOne(id);

    // Get all services for this cliente
    return await this.serviciosRepository.find({
      where: { idCliente: id },
      relations: ['equipo', 'tecnico', 'tipoServicio', 'cliente', 'sucursal'],
      order: { fechaServicio: 'DESC' },
    });
  }

  async getEquipos(id: number) {
    // First verify cliente exists
    await this.findOne(id);

    // Get all equipos for this cliente
    return await this.equiposRepository.find({
      where: { idCliente: id },
      relations: ['marca', 'tipoEquipo', 'sucursal', 'cliente'],
      order: { nombre: 'ASC' },
    });
  }
}
