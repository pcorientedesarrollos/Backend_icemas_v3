import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FotoServicio } from '../../servicios/entities/foto-servicio.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
    constructor(
        @InjectRepository(FotoServicio)
        private fotosRepository: Repository<FotoServicio>,
    ) { }

    async uploadFotoServicio(idServicio: number, file: Express.Multer.File): Promise<FotoServicio> {
        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only image files (JPEG, PNG, WEBP) are allowed');
        }

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const filename = `foto_${idServicio}_${Date.now()}${fileExt}`;

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'uploads', 'fotos_servicio');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save file
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);

        // Save to database
        const foto = this.fotosRepository.create({
            idServicio,
            imagen: filename,
        });

        return await this.fotosRepository.save(foto);
    }

    async deleteFoto(id: number): Promise<void> {
        const foto = await this.fotosRepository.findOne({ where: { id } });
        if (!foto) {
            throw new BadRequestException('Photo not found');
        }

        // Delete from filesystem
        const filepath = path.join(process.cwd(), 'uploads', 'fotos_servicio', foto.imagen);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        // Delete from database
        await this.fotosRepository.remove(foto);
    }

    async getFotosByServicio(idServicio: number): Promise<FotoServicio[]> {
        return await this.fotosRepository.find({
            where: { idServicio },
            order: { createdAt: 'DESC' },
        });
    }

    getPhotoUrl(filename: string): string {
        return `/uploads/fotos_servicio/${filename}`;
    }
}
