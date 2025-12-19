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
} from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Post()
  create(@Body() createSucursalDto: CreateSucursalDto) {
    return this.sucursalesService.create(createSucursalDto);
  }

  @Get()
  findAll(@Query('idCliente') idCliente?: string) {
    return this.sucursalesService.findAll(idCliente ? +idCliente : undefined);
  }

  @Get('por-cliente/:id')
  porCliente(@Param('id') id: string) {
    return this.sucursalesService.porCliente(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sucursalesService.findOne(+id);
  }

  @Get(':id/equipos')
  getEquipos(@Param('id') id: string) {
    return this.sucursalesService.getEquipos(+id);
  }

  @Get(':id/servicios')
  getServicios(@Param('id') id: string) {
    return this.sucursalesService.getServicios(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateSucursalDto: UpdateSucursalDto,
  ) {
    return this.sucursalesService.update(+id, updateSucursalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sucursalesService.remove(+id);
  }
}
