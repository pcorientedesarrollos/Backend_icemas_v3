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
  ) { }

  async create(createTecnicoDto: CreateTecnicoDto) {
    const tecnico = this.tecnicosRepository.create(createTecnicoDto);
    return await this.tecnicosRepository.save(tecnico);
  }

  async findAll() {
    return await this.tecnicosRepository.find({ order: { idTecnico: 'DESC' } });
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

  async getSignature(id: number) {
    const tecnico = await this.findOne(id);

    if (!tecnico.firma) {
      throw new NotFoundException('This technician has no signature saved');
    }

    // Construct file path
    const firmaPath = path.join(
      process.cwd(),
      'uploads',
      'firmas_tecnicos',
      tecnico.firma,
    );

    if (!fs.existsSync(firmaPath)) {
      throw new NotFoundException('Signature file not found on server');
    }

    const fileBuffer = fs.readFileSync(firmaPath);
    return {
      signature: `data:image/png;base64,${fileBuffer.toString('base64')}`,
    };
  }

  async deleteSignature(id: number) {
    const tecnico = await this.findOne(id);

    if (!tecnico.firma) {
      throw new NotFoundException('Tecnico does not have a signature to delete');
    }

    // Construct file path
    const firmaPath = path.join(
      process.cwd(),
      'uploads',
      'firmas_tecnicos',
      tecnico.firma,
    );

    // Delete file from filesystem if it exists
    if (fs.existsSync(firmaPath)) {
      try {
        fs.unlinkSync(firmaPath);
      } catch (error) {
        console.error(`Error deleting signature file: ${error.message}`);
      }
    }

    // Remove reference from database
    await this.tecnicosRepository.update({ idTecnico: id }, { firma: null });

    return { message: 'Signature deleted successfully' };
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
