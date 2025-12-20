import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Servicio } from '../../servicios/entities/servicio.entity';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Servicio)
    private serviciosRepository: Repository<Servicio>,
  ) { }

  async generateServicioPdf(idServicio: number): Promise<Buffer> {
    // Get servicio with all relationships
    const servicio = await this.serviciosRepository.findOne({
      where: { idServicio },
      relations: [
        'cliente',
        'sucursal',
        'equipo',
        'tecnico',
        'tipoServicio',
        'fotos',
      ],
    });

    if (!servicio) {
      throw new Error('Servicio not found');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('ORDEN DE SERVICIO', { align: 'center' });
      doc.moveDown();

      // Service Info
      doc.fontSize(12).text(`Folio: ${servicio.folio}`, { continued: true });
      doc.text(`     Estado: ${servicio.estado}`, { align: 'right' });
      doc.text(
        `Fecha: ${new Date(servicio.fechaServicio).toLocaleDateString()}`,
      );
      doc.moveDown();

      // Client Info
      doc.fontSize(14).text('CLIENTE', { underline: true });
      doc.fontSize(10);
      doc.text(`Nombre: ${servicio.cliente?.nombre || 'N/A'}`);
      doc.text(`Empresa: ${servicio.cliente?.empresa || 'N/A'}`);
      if (servicio.sucursal) {
        doc.text(`Sucursal: ${servicio.sucursal.nombre}`);
        doc.text(`Dirección: ${servicio.sucursal.direccion || 'N/A'}`);
      }
      doc.moveDown();

      // Equipment Info
      doc.fontSize(14).text('EQUIPO', { underline: true });
      doc.fontSize(10);
      doc.text(`Equipo: ${servicio.equipo?.nombre || 'N/A'}`);
      doc.text(`Modelo: ${servicio.equipo?.modelo || 'N/A'}`);
      doc.text(`Serie: ${servicio.equipo?.serie || 'N/A'}`);
      doc.moveDown();

      // Technician Info
      doc.fontSize(14).text('TÉCNICO', { underline: true });
      doc.fontSize(10);
      doc.text(`Nombre: ${servicio.tecnico?.nombre || 'N/A'}`);
      doc.text(`Especialidad: ${servicio.tecnico?.especialidad || 'N/A'}`);
      doc.moveDown();

      // Service Details
      doc.fontSize(14).text('DETALLES DEL SERVICIO', { underline: true });
      doc.fontSize(10);
      doc.text(`Tipo: ${servicio.tipoServicio?.nombre || 'N/A'}`);
      if (servicio.descripcion) {
        doc.text(`Descripción: ${servicio.descripcion}`);
      }
      if (servicio.detalleTrabajo) {
        doc.moveDown(0.5);
        doc.text('Trabajo Realizado:');
        doc.text(servicio.detalleTrabajo, { indent: 20 });
      }
      doc.moveDown();

      // Photos count
      if (servicio.fotos && servicio.fotos.length > 0) {
        doc.text(`Fotos adjuntas: ${servicio.fotos.length}`);
      }

      // Signatures
      // Ensure we have enough space for signatures (approx 150px needed)
      if (doc.y + 150 > doc.page.height - 50) {
        doc.addPage();
      } else {
        doc.moveDown(2);
      }

      const signatureY = doc.y;

      console.log('Generating PDF - Service ID:', servicio.idServicio);
      console.log('Firma Tecnico:', servicio.firmaTecnico);
      console.log('Firma Cliente:', servicio.firma);

      // Technician Signature (Left)
      // Line and Label
      doc.fontSize(10).text('Firma del Técnico', 50, signatureY + 80, { width: 200, align: 'center' });
      doc.moveTo(70, signatureY + 75).lineTo(230, signatureY + 75).stroke();

      if (servicio.firmaTecnico) {
        try {
          const firmaTecnicoPath = path.join(process.cwd(), 'uploads', 'firmas', servicio.firmaTecnico);
          console.log('Loading technician signature from:', firmaTecnicoPath);
          if (fs.existsSync(firmaTecnicoPath)) {
            doc.image(firmaTecnicoPath, 70, signatureY, { fit: [160, 70], align: 'center' });
          } else {
            console.warn('Technician signature file not found at path:', firmaTecnicoPath);
          }
        } catch (e) {
          console.error('Error loading technician signature for PDF', e);
        }
      }

      // Client Signature (Right)
      // Line and Label
      doc.text('Firma de Conformidad', 350, signatureY + 80, { width: 200, align: 'center' });
      doc.moveTo(370, signatureY + 75).lineTo(530, signatureY + 75).stroke();

      if (servicio.firma) {
        try {
          const firmaClientePath = path.join(process.cwd(), 'uploads', 'firmas', servicio.firma);
          console.log('Loading client signature from:', firmaClientePath);
          if (fs.existsSync(firmaClientePath)) {
            doc.image(firmaClientePath, 370, signatureY, { fit: [160, 70], align: 'center' });
          } else {
            console.warn('Client signature file not found at path:', firmaClientePath);
          }
        } catch (e) {
          console.error('Error loading client signature for PDF', e);
        }
      }

      // Footer
      doc.moveDown(4);
      doc.fontSize(8).text('_'.repeat(80), 50, doc.y);
      doc.text('ICEMAS - Sistema de Gestión de Servicios', { align: 'center' });

      doc.end();
    });
  }

  async generateReportePorFecha(
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<Buffer> {
    const servicios = await this.serviciosRepository.find({
      where: {
        fechaServicio: Between(fechaInicio, fechaFin),
      },
      relations: ['cliente', 'tecnico', 'equipo'],
      order: { fechaServicio: 'DESC' },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 50,
        size: 'LETTER',
        layout: 'landscape',
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).text('REPORTE DE SERVICIOS', { align: 'center' });
      doc
        .fontSize(10)
        .text(
          `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`,
          { align: 'center' },
        );
      doc.moveDown();

      // Table Header
      doc.fontSize(9);
      const tableTop = doc.y;
      doc.text('Folio', 50, tableTop, { width: 60 });
      doc.text('Fecha', 110, tableTop, { width: 70 });
      doc.text('Cliente', 180, tableTop, { width: 120 });
      doc.text('Equipo', 300, tableTop, { width: 100 });
      doc.text('Técnico', 400, tableTop, { width: 100 });
      doc.text('Estado', 500, tableTop, { width: 80 });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(580, tableTop + 15)
        .stroke();
      doc.moveDown();

      // Data rows
      let y = tableTop + 25;
      servicios.forEach((servicio) => {
        if (y > 520) {
          doc.addPage();
          y = 50;
        }

        doc.text(servicio.folio, 50, y, { width: 60 });
        doc.text(
          new Date(servicio.fechaServicio).toLocaleDateString(),
          110,
          y,
          { width: 70 },
        );
        doc.text(servicio.cliente?.empresa || 'N/A', 180, y, { width: 120 });
        doc.text(servicio.equipo?.nombre || 'N/A', 300, y, { width: 100 });
        doc.text(servicio.tecnico?.nombre || 'N/A', 400, y, { width: 100 });
        doc.text(servicio.estado, 500, y, { width: 80 });

        y += 20;
      });

      // Summary
      doc.moveDown(2);
      doc
        .fontSize(10)
        .text(`Total de servicios: ${servicios.length}`, { align: 'right' });

      doc.end();
    });
  }
}
