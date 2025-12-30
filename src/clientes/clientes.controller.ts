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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) { }

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.clientesService.findAll(search);
  }

  @Get('autocomplete')
  autocomplete(@Query('term') term: string) {
    return this.clientesService.autocomplete(term || '');
  }

  @Get('check-nombre')
  checkNombre(@Query('nombre') nombre: string) {
    return this.clientesService.checkNombre(nombre);
  }

  @Get('export')
  async export(@Res() res: Response) {
    const buffer = await this.clientesService.exportFullData();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=clientes_full_data.xlsx',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(+id);
  }

  @Get(':id/sucursales')
  getSucursales(@Param('id') id: string) {
    return this.clientesService.getSucursales(+id);
  }

  @Get(':id/servicios')
  getServicios(@Param('id') id: string) {
    return this.clientesService.getServicios(+id);
  }

  @Get(':id/equipos')
  getEquipos(@Param('id') id: string) {
    return this.clientesService.getEquipos(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(+id, updateClienteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientesService.remove(+id);
  }
}
