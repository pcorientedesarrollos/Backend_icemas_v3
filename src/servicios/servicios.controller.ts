import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { SaveSignatureDto } from './dto/save-signature.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../common/services/upload.service';
import { PdfService } from '../common/services/pdf.service';

@Controller('servicios')
@UseGuards(JwtAuthGuard)
export class ServiciosController {
  constructor(
    private readonly serviciosService: ServiciosService,
    private readonly uploadService: UploadService,
    private readonly pdfService: PdfService,
  ) { }

  @Post()
  create(@Body() createServicioDto: CreateServicioDto, @Request() req) {
    return this.serviciosService.create(createServicioDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('idServicio') idServicio?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('cliente') cliente?: string,
    @Query('equipo') equipo?: string,
    @Query('serie') serie?: string,
    @Query('estado') estado?: string,
    @Query('detalle') detalle?: string,
  ) {
    return this.serviciosService.findAll({
      idServicio: idServicio ? +idServicio : undefined,
      fechaInicio,
      fechaFin,
      cliente,
      equipo,
      serie,
      estado,
      detalle,
    });
  }

  @Get('pendientes')
  findPendientes() {
    return this.serviciosService.findByEstado('Pendiente');
  }

  @Get('en-proceso')
  findEnProceso() {

  }

  @Get('completados')
  findCompletados() {
    return this.serviciosService.findByEstado('Completado');
  }

  @Get('cancelados')
  findCancelados() {
    return this.serviciosService.findByEstado('Cancelado');
  }

  @Get('check-folio')
  checkFolio(@Query('folio') folio: string) {
    return this.serviciosService.checkFolio(folio);
  }

  @Get('autocomplete/id')
  autocompleteId(@Query('term') term: string) {
    return this.serviciosService.autocompleteId(term || '');
  }

  @Get('autocomplete/cliente')
  autocompleteCliente(@Query('term') term: string) {
    return this.serviciosService.autocompleteCliente(term || '');
  }

  @Get('tipos')
  findAllTiposServicio() {
    return this.serviciosService.findAllTiposServicio();
  }

  @Post('tipos')
  createTipoServicio(@Body() body: { nombre: string; descripcion?: string }) {
    return this.serviciosService.createTipoServicio(
      body.nombre,
      body.descripcion,
    );
  }

  @Get('tipos/check-nombre')
  checkNombreTipoServicio(@Query('nombre') nombre: string) {
    return this.serviciosService.checkNombreTipoServicio(nombre);
  }

  @Get('tipos/:id')
  findOneTipoServicio(@Param('id') id: string) {
    return this.serviciosService.findOneTipoServicio(+id);
  }

  @Put('tipos/:id')
  updateTipoServicio(
    @Param('id') id: string,
    @Body() body: { nombre?: string; descripcion?: string },
  ) {
    return this.serviciosService.updateTipoServicio(+id, body);
  }

  @Delete('tipos/:id')
  removeTipoServicio(@Param('id') id: string) {
    return this.serviciosService.removeTipoServicio(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviciosService.findOne(+id);
  }

  @Post(':id/firma')
  saveSignature(
    @Param('id') id: string,
    @Body() saveSignatureDto: SaveSignatureDto,
  ) {
    return this.serviciosService.saveSignature(+id, saveSignatureDto);
  }

  @Post(':id/firma-tecnico')
  saveTechnicianSignature(
    @Param('id') id: string,
    @Body() saveSignatureDto: SaveSignatureDto,
  ) {
    return this.serviciosService.saveTechnicianSignature(+id, saveSignatureDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateServicioDto: Partial<CreateServicioDto>,
    @Request() req,
  ) {
    return this.serviciosService.update(+id, updateServicioDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviciosService.remove(+id);
  }

  @Post(':id/fotos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('tipo') tipo?: string,
  ) {
    return this.uploadService.uploadFotoServicio(+id, file, tipo);
  }

  @Get(':id/fotos')
  getFotos(@Param('id') id: string) {
    return this.uploadService.getFotosByServicio(+id);
  }

  @Delete('fotos/:fotoId')
  deleteFoto(@Param('fotoId') fotoId: string) {
    return this.uploadService.deleteFoto(+fotoId);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generateServicioPdf(+id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=servicio_${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
