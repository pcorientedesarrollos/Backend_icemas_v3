import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
    constructor(
        @InjectRepository(Cliente)
        private clientesRepository: Repository<Cliente>,
    ) { }

    async create(createClienteDto: CreateClienteDto) {
        const cliente = this.clientesRepository.create(createClienteDto);
        return await this.clientesRepository.save(cliente);
    }

    async findAll(search?: string) {
        if (!search) {
            return [];
        }

        return await this.clientesRepository.find({
            where: [
                { nombre: Like(`%${search}%`) },
                { empresa: Like(`%${search}%`) },
                { telefono: Like(`%${search}%`) },
            ],
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

        return clientes.map(c => ({
            value: c.idCliente,
            label: `${c.nombre} - ${c.empresa}`,
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
}
