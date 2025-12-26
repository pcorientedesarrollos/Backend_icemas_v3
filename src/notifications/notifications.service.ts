import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationsService {
  constructor(private readonly mailerService: MailerService) { }

  /**
   * Enviar email con PDF adjunto
   */
  async sendServicePDF(
    to: string,
    clientName: string,
    folio: string,
    pdfBuffer: Buffer,
  ): Promise<void> {
    // Leer el logo desde la carpeta public
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo_icemas.png');
    const logoBuffer = fs.readFileSync(logoPath);

    await this.mailerService.sendMail({
      to,
      subject: `Reporte de Servicio - ${folio}`,
      html: this.getEmailTemplate(clientName, folio),
      attachments: [
        {
          filename: `Servicio_${folio}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: 'logo_icemas.png',
          content: logoBuffer,
          cid: 'logo_icemas', // CID para referenciar en el HTML
          contentType: 'image/png',
        },
      ],
    });
  }

  /**
   * Template HTML para el email
   */
  private getEmailTemplate(clientName: string, folio: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: white;
            border-radius: 50%;
            display: table;
            line-height: 80px;
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
          }
          .header h1 {
            margin: 0 0 10px;
            font-size: 24px;
            font-weight: bold;
          }
          .header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            background: #ffffff;
            padding: 30px 20px;
          }
          .content p {
            margin: 0 0 15px;
          }
          .footer {
            background: #f9fafb;
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:logo_icemas" alt="ICEMAS Logo" style="width: 100px; height: 100px; margin: 0 auto 20px; display: block;">
            <h1>ICEMAS EQUIPOS S.A. DE C.V.</h1>
            <p>Servicio Completado</p>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${clientName}</strong>,</p>
            <p>Le informamos que el servicio con folio <strong>${folio}</strong> ha sido completado exitosamente.</p>
            <p>Adjunto encontrará el reporte completo del servicio realizado en formato PDF.</p>
            <p>Si tiene alguna pregunta o necesita más información, no dude en contactarnos.</p>
            <p>Gracias por confiar en ICEMAS.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} ICEMAS EQUIPOS - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Método de prueba para verificar configuración SMTP
   */
  async testConnection(email: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Prueba de Configuración SMTP - ICEMAS',
      html: '<h1>¡Configuración exitosa!</h1><p>El servicio de email está funcionando correctamente.</p>',
    });
  }
}
