import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tecnico } from './entities/tecnico.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { CreateTecnicoDto } from './dto/create-tecnico.dto';
import { SaveSignatureDto } from '../servicios/dto/save-signature.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TecnicosService {
  constructor(
    @InjectRepository(Tecnico)
    private tecnicosRepository: Repository<Tecnico>,
    @InjectRepository(Servicio)
    private serviciosRepository: Repository<Servicio>,
  ) {}

  async create(createTecnicoDto: CreateTecnicoDto) {
    const tecnico = this.tecnicosRepository.create(createTecnicoDto);
    return await this.tecnicosRepository.save(tecnico);
  }

  async findAll() {
    return await this.tecnicosRepository.find({ order: { nombre: 'ASC' } });
  }

  async autocomplete(term: string) {
    if (!term || term.length < 2) {
      return [];
    }

    const tecnicos = await this.tecnicosRepository
      .createQueryBuilder('tecnico')
      .where('tecnico.nombre LIKE :term', { term: `%${term}%` })
      .orWhere('tecnico.especialidad LIKE :term', { term: `%${term}%` })
      .orderBy('tecnico.nombre', 'ASC')
      .limit(10)
      .getMany();

    return tecnicos.map((t) => ({
      id: t.idTecnico,
      label: t.nombre,
      subtitle: t.especialidad || t.telefono,
    }));
  }

  async findOne(id: number) {
    const tecnico = await this.tecnicosRepository.findOne({
      where: { idTecnico: id },
      relations: ['servicios'],
    });

    if (!tecnico) {
      throw new NotFoundException(`Tecnico with ID ${id} not found`);
    }

    return tecnico;
  }

  async update(id: number, updateTecnicoDto: Partial<CreateTecnicoDto>) {
    await this.findOne(id);
    await this.tecnicosRepository.update({ idTecnico: id }, updateTecnicoDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const tecnico = await this.tecnicosRepository.findOne({
      where: { idTecnico: id },
      relations: ['servicios'],
    });

    if (!tecnico) {
      throw new NotFoundException(`Tecnico with ID ${id} not found`);
    }

    if (tecnico.servicios && tecnico.servicios.length > 0) {
      throw new BadRequestException(
        'Cannot delete tecnico with associated servicios',
      );
    }

    await this.tecnicosRepository.remove(tecnico);
    return { message: 'Tecnico deleted successfully' };
  }

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
    const uploadsDir = path.join(process.cwd(), 'uploads', 'firmas_tecnicos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file
    const filename = `firma_tecnico_${id}_${Date.now()}.png`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);

    // Update tecnico
    await this.tecnicosRepository.update(
      { idTecnico: id },
      { firma: filename },
    );

    return { success: true, message: 'Firma guardada correctamente', filename };
  }

  async getServicios(id: number) {
    // First verify tecnico exists
    await this.findOne(id);

    // Get all services for this tecnico
    return await this.serviciosRepository.find({
      where: { idTecnico: id },
      relations: ['equipo', 'tecnico', 'tipoServicio', 'cliente'],
      order: { fechaServicio: 'DESC' },
    });
  }
}
