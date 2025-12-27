import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Servicio } from '../../servicios/entities/servicio.entity';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

type PDFDoc = typeof PDFDocument extends new (...args: any[]) => infer R ? R : any;

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Servicio)
    private serviciosRepository: Repository<Servicio>,
  ) { }

  async generateServicioPdf(idServicio: number): Promise<Buffer> {
    // Get servicio with all relationships including equiposAsignados
    const servicio = await this.serviciosRepository.findOne({
      where: { idServicio },
      relations: [
        'cliente',
        'sucursal',
        'equipo',
        'tecnico',
        'tipoServicio',
        'fotos',
        'equiposAsignados',
        'equiposAsignados.equipo',
        'equiposAsignados.equipo.tipoEquipo',
        'equiposAsignados.equipo.marca',
      ],
    });

    if (!servicio) {
      throw new Error('Servicio not found');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);

      // ===== HEADER AZUL =====
      this.drawHeader(doc, servicio, pageWidth);

      // ===== SERVICE INFO =====
      doc.y = 110;
      this.drawSection(doc, 'INFORMACIÓN DEL SERVICIO', margin, contentWidth);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1F2937')
        .text('Fecha:', margin, doc.y, { continued: true })
        .font('Helvetica').text(`  ${new Date(servicio.fechaServicio).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, { continued: false });

      doc.font('Helvetica-Bold').text('Tipo de Servicio:', pageWidth / 2, doc.y - 10, { continued: true })
        .font('Helvetica').text(`  ${servicio.tipoServicio?.nombre || 'N/A'}`);

      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').text('Técnico:', margin, doc.y, { continued: true })
        .font('Helvetica').text(`  ${servicio.tecnico?.nombre || 'N/A'}`);

      // ===== CLIENT INFO =====
      doc.moveDown(1.5);
      this.drawSection(doc, 'DATOS DEL CLIENTE', margin, contentWidth);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1F2937')
        .text('Nombre:', margin, doc.y, { continued: true })
        .font('Helvetica').text(`  ${servicio.cliente?.nombre || 'N/A'}`, { continued: false });

      if (servicio.cliente?.empresa) {
        doc.font('Helvetica-Bold').text('Empresa:', pageWidth / 2, doc.y - 10, { continued: true })
          .font('Helvetica').text(`  ${servicio.cliente.empresa}`);
      }

      doc.moveDown(0.3);
      if (servicio.cliente?.telefono) {
        doc.font('Helvetica-Bold').text('Teléfono:', margin, doc.y, { continued: true })
          .font('Helvetica').text(`  ${servicio.cliente.telefono}`, { continued: false });
      }

      if (servicio.cliente?.email) {
        doc.font('Helvetica-Bold').text('Email:', pageWidth / 2, doc.y - 10, { continued: true })
          .font('Helvetica').text(`  ${servicio.cliente.email}`);
      }

      if (servicio.sucursal) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('Sucursal:', margin, doc.y, { continued: true })
          .font('Helvetica').text(`  ${servicio.sucursal.nombre}${servicio.sucursal.direccion ? ' (Poniente)' : ''}`);

        if (servicio.sucursal.direccion) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold').text('Dirección:', margin, doc.y, { continued: true })
            .font('Helvetica').text(`  ${servicio.sucursal.direccion}`);
        }
      }

      // ===== EQUIPMENT INFO (Múltiples equipos) =====
      doc.moveDown(1.5);
      this.drawSection(doc, 'EQUIPOS', margin, contentWidth);

      // Usar equiposAsignados si existen, sino usar equipo único
      const equipos = servicio.equiposAsignados && servicio.equiposAsignados.length > 0
        ? servicio.equiposAsignados.map(ea => ea.equipo)
        : (servicio.equipo ? [servicio.equipo] : []);

      if (equipos.length > 0) {
        equipos.forEach((equipo, index) => {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
            doc.y = 50;
          }

          // Background gris claro
          const rectY = doc.y - 5;
          doc.rect(margin, rectY, contentWidth, 35).fillAndStroke('#F9FAFB', '#E5E7EB');

          doc.font('Helvetica-Bold').fontSize(10).fillColor('#1F2937')
            .text(`${index + 1}. ${equipo.nombre || 'N/A'}`, margin + 5, rectY + 5);

          doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
          let detailsText = '';
          if (equipo.marca?.nombre) detailsText += `Marca: ${equipo.marca.nombre}   `;
          if (equipo.modelo) detailsText += `Modelo: ${equipo.modelo}   `;
          if (equipo.serie) detailsText += `Serie: ${equipo.serie}`;

          if (detailsText) {
            doc.text(detailsText, margin + 10, rectY + 20);
          }

          doc.y = rectY + 40;
        });
      } else {
        doc.font('Helvetica').fontSize(9).fillColor('#6B7280')
          .text('No hay equipos asignados', margin, doc.y);
        doc.moveDown();
      }

      // ===== WORK DETAILS (Two Columns) =====
      doc.moveDown(1);
      this.drawSection(doc, 'DETALLE DEL TRABAJO', margin, contentWidth);

      const colWidth = (contentWidth - 20) / 2;
      const col1X = margin;
      const detailsCol2X = margin + colWidth + 20;
      const startY = doc.y;

      // Column 1: Descripción
      if (servicio.descripcion) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1F2937')
          .text('Descripción del Problema:', col1X, startY);
        doc.moveDown(0.3);
        doc.font('Helvetica').fillColor('#374151')
          .text(servicio.descripcion, col1X, doc.y, { width: colWidth, align: 'left' });
      }

      // Column 2: Trabajo Realizado
      // Reset Y to startY for the second column, but we need to track the max height used
      const col1EndY = doc.y;

      if (servicio.detalleTrabajo) {
        doc.y = startY; // Go back to top for second column
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1F2937')
          .text('Trabajo Realizado:', detailsCol2X, startY);
        doc.moveDown(0.3);
        doc.font('Helvetica').fillColor('#374151')
          .text(servicio.detalleTrabajo, detailsCol2X, doc.y, { width: colWidth, align: 'left' });
      }

      const col2EndY = doc.y;

      // Move cursor to below the longest column
      doc.y = Math.max(col1EndY, col2EndY) + 10;


      // ===== SIGNATURES (PRIMERO) =====
      // Asegurar espacio para firmas
      if (doc.y + 120 > doc.page.height - 80) {
        doc.addPage();
        doc.y = 50;
      } else {
        doc.moveDown(2);
      }

      const signatureY = doc.y;
      const sigWidth = 150;
      const sigHeight = 80; // Increased from 60

      // Firma del Técnico (izquierda)
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4d82bc')
        .text('FIRMA DEL TÉCNICO', margin, signatureY);

      console.log('=== DEBUG FIRMA TÉCNICO ===');
      console.log('servicio.firmaTecnico:', servicio.firmaTecnico);
      console.log('servicio.tecnico?.firma:', servicio.tecnico?.firma);

      // Intentar primero con firma del servicio, luego con firma del perfil del técnico
      let firmaUsada = null;
      let firmaPath = null;

      if (servicio.firmaTecnico) {
        firmaUsada = 'Firma específica del servicio';
        firmaPath = path.join(process.cwd(), 'uploads', 'firmas', servicio.firmaTecnico);
      } else if (servicio.tecnico?.firma) {
        firmaUsada = 'Firma del perfil del técnico';
        firmaPath = path.join(process.cwd(), 'uploads', 'firmas_tecnicos', servicio.tecnico.firma);
      }

      console.log('Usando:', firmaUsada);

      if (firmaPath) {
        try {
          console.log('Intentando cargar firma desde:', firmaPath);
          console.log('¿Existe el archivo?', fs.existsSync(firmaPath));

          if (fs.existsSync(firmaPath)) {
            console.log('✓ Archivo encontrado, agregando al PDF...');
            doc.image(firmaPath, margin, signatureY + 5, { fit: [sigWidth, sigHeight] });
            console.log('✓ Imagen agregada al PDF');
          } else {
            console.warn('✗ Archivo NO encontrado en:', firmaPath);
          }
        } catch (e) {
          console.error('✗ Error cargando firma técnico:', e);
        }
      } else {
        console.log('✗ No hay firma del técnico disponible (ni en servicio ni en perfil)');
      }

      doc.moveTo(margin, signatureY + sigHeight + 15)
        .lineTo(margin + sigWidth, signatureY + sigHeight + 15)
        .stroke('#1F2937');
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280')
        .text('Firma del Técnico', margin, signatureY + sigHeight + 20, { width: sigWidth, align: 'center' });

      // Firma del Cliente (derecha)
      const col2X = pageWidth - margin - sigWidth;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4d82bc')
        .text('FIRMA DEL CLIENTE', col2X, signatureY);

      if (servicio.firma) {
        try {
          const firmaClientePath = path.join(process.cwd(), 'uploads', 'firmas', servicio.firma);
          if (fs.existsSync(firmaClientePath)) {
            doc.image(firmaClientePath, col2X, signatureY + 5, { fit: [sigWidth, sigHeight] });
          } else {
            console.warn('Client signature not found:', firmaClientePath);
          }
        } catch (e) {
          console.error('Error loading client signature:', e);
        }
      }

      doc.moveTo(col2X, signatureY + sigHeight + 15)
        .lineTo(col2X + sigWidth, signatureY + sigHeight + 15)
        .stroke('#1F2937');
      doc.font('Helvetica').fontSize(8).fillColor('#6B7280')
        .text('Firma de Conformidad', col2X, signatureY + sigHeight + 20, { width: sigWidth, align: 'center' });

      doc.y = signatureY + sigHeight + 35;

      // ===== PHOTOS (DESPUÉS DE FIRMAS) =====
      if (servicio.fotos && servicio.fotos.length > 0) {
        // Check if we need a new page
        if (doc.y + 80 > doc.page.height - 80) {
          doc.addPage();
          doc.y = 50;
        } else {
          doc.moveDown(1.5);
        }

        this.drawSection(doc, 'FOTOS DEL SERVICIO', margin, contentWidth);

        const photosPerRow = 2;
        const photoWidth = (contentWidth - 10) / 2;
        const photoHeight = photoWidth * 0.75; // Aspect ratio 4:3
        let col = 0;
        let currentY = doc.y;

        for (let i = 0; i < Math.min(servicio.fotos.length, 6); i++) {
          const foto = servicio.fotos[i];

          if (currentY + photoHeight + 20 > doc.page.height - 80) {
            doc.addPage();
            currentY = 50;
            col = 0;
          }

          const xPos = margin + (col * (photoWidth + 10));

          try {
            const fotoPath = path.join(process.cwd(), 'uploads', 'fotos_servicio', foto.imagen);
            if (fs.existsSync(fotoPath)) {
              doc.image(fotoPath, xPos, currentY, { fit: [photoWidth, photoHeight] });

              // Label
              doc.font('Helvetica').fontSize(7).fillColor('#6B7280')
                .text(foto.tipo === 'antes' ? 'Antes del servicio' : 'Después del servicio',
                  xPos, currentY + photoHeight + 3, { width: photoWidth, align: 'center' });
            }
          } catch (e) {
            console.error(`Error loading photo ${foto.imagen}:`, e);
          }

          col++;
          if (col >= photosPerRow) {
            col = 0;
            currentY += photoHeight + 20;
          }
        }

        if (col !== 0) {
          currentY += photoHeight + 20;
        }
        doc.y = currentY + 10;
      }

      // ===== FOOTER =====
      const footerY = doc.page.height - 40;
      doc.moveTo(margin, footerY)
        .lineTo(pageWidth - margin, footerY)
        .stroke('#E5E7EB');

      doc.font('Helvetica').fontSize(7).fillColor('#6B7280')
        .text(`Generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`,
          margin, footerY + 5);
      doc.text('ICEMAS - Sistema de Gestión de Servicios',
        pageWidth - margin, footerY + 5, { align: 'right' });

      doc.end();
    });
  }

  private drawHeader(doc: PDFDoc, servicio: any, pageWidth: number): void {
    // Header Background Azul
    doc.rect(0, 0, pageWidth, 80).fill('#4d82bc');

    // Logo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo_icemas.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 10, { width: 60, height: 60 });
      }
    } catch (e) {
      console.warn('Logo not found for PDF header');
    }

    // Company Name and Slogan (al lado del logo)
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#FFFFFF')
      .text('ICEMAS EQUIPOS S.A. DE C.V.', 120, 20);
    doc.font('Helvetica').fontSize(9)
      .text('Sistema de Gestión de Servicios', 120, 35);

    // Order Number (right side)
    doc.font('Helvetica-Bold').fontSize(11)
      .text(`Orden: ${servicio.folio}`, pageWidth - 200, 25, { width: 150, align: 'right' });

    // Status Badge
    const statusColor = this.getStatusColor(servicio.estado);
    doc.roundedRect(pageWidth - 120, 42, 70, 18, 3).fill(statusColor);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF')
      .text(servicio.estado, pageWidth - 115, 48, { width: 60, align: 'center' });
  }

  private drawSection(doc: PDFDoc, title: string, margin: number, contentWidth: number): void {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#4d82bc')
      .text(title, margin, doc.y);
    doc.moveDown(0.5);
    doc.moveTo(margin, doc.y)
      .lineTo(margin + contentWidth, doc.y)
      .stroke('#E5E7EB');
    doc.moveDown(0.5);
  }

  private getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completado': return '#10B981'; // Green
      case 'en proceso': return '#3B82F6'; // Blue
      case 'pendiente': return '#F59E0B'; // Amber
      case 'cancelado': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
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
