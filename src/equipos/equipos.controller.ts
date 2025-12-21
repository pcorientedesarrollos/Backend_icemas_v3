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
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { CreateTipoEquipoDto } from './dto/create-tipo-equipo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('equipos')
@UseGuards(JwtAuthGuard)
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) { }

  // ============= EQUIPOS =============
  @Post()
  createEquipo(@Body() createEquipoDto: CreateEquipoDto) {
    return this.equiposService.createEquipo(createEquipoDto);
  }

  @Post('ajax')
  createEquipoAjax(@Body() createEquipoDto: CreateEquipoDto) {
    return this.equiposService.createEquipo(createEquipoDto);
  }

  @Get()
  findAllEquipos(
    @Query('nombre') nombre?: string,
    @Query('marca') marca?: string,
    @Query('serie') serie?: string,
    @Query('tipo') tipo?: string,
    @Query('cliente') cliente?: string,
    @Query('estado') estado?: string,
    @Query('search') search?: string,
  ) {
    return this.equiposService.findAllEquipos({
      nombre,
      marca,
      serie,
      tipo,
      cliente,
      estado: estado ? +estado : undefined,
      search,
    });
  }

  @Get('autocomplete/nombre')
  autocompleteNombre(@Query('term') term: string) {
    return this.equiposService.autocompleteNombre(term || '');
  }

  @Get('autocomplete/serie')
  autocompleteSerie(@Query('term') term: string) {
    return this.equiposService.autocompleteSerie(term || '');
  }

  @Get('por-sucursal/:id')
  porSucursal(@Param('id') id: string) {
    return this.equiposService.porSucursal(+id);
  }

  // ============= MARCAS ============= (MOVED BEFORE :id)
  @Get('marcas')
  findAllMarcas() {
    return this.equiposService.findAllMarcas();
  }

  @Post('marcas')
  createMarca(@Body() createMarcaDto: CreateMarcaDto) {
    return this.equiposService.createMarca(createMarcaDto);
  }

  @Get('marcas/check-nombre')
  checkNombreMarca(@Query('nombre') nombre: string) {
    return this.equiposService.checkNombreMarca(nombre);
  }

  @Get('marcas/:id')
  findOneMarca(@Param('id') id: string) {
    return this.equiposService.findOneMarca(+id);
  }

  @Put('marcas/:id')
  updateMarca(
    @Param('id') id: string,
    @Body() updateMarcaDto: Partial<CreateMarcaDto>,
  ) {
    return this.equiposService.updateMarca(+id, updateMarcaDto);
  }

  @Delete('marcas/:id')
  removeMarca(@Param('id') id: string) {
    return this.equiposService.removeMarca(+id);
  }

  // ============= TIPOS EQUIPO ============= (MOVED BEFORE :id)
  @Get('tipos')
  findAllTipos() {
    return this.equiposService.findAllTipos();
  }

  @Post('tipos')
  createTipo(@Body() createTipoDto: CreateTipoEquipoDto) {
    return this.equiposService.createTipo(createTipoDto);
  }

  @Get('tipos/check-nombre')
  checkNombreTipo(@Query('nombre') nombre: string) {
    return this.equiposService.checkNombreTipo(nombre);
  }

  @Get('tipos/:id')
  findOneTipo(@Param('id') id: string) {
    return this.equiposService.findOneTipo(+id);
  }

  @Put('tipos/:id')
  updateTipo(
    @Param('id') id: string,
    @Body() updateTipoDto: Partial<CreateTipoEquipoDto>,
  ) {
    return this.equiposService.updateTipo(+id, updateTipoDto);
  }

  @Delete('tipos/:id')
  removeTipo(@Param('id') id: string) {
    return this.equiposService.removeTipo(+id);
  }

  // ============= EQUIPOS :id ============= (MOVED AFTER SPECIFIC ROUTES)
  @Get(':id')
  findOneEquipo(@Param('id') id: string) {
    return this.equiposService.findOneEquipo(+id);
  }

  @Get(':id/servicios')
  getServicios(@Param('id') id: string) {
    return this.equiposService.getServicios(+id);
  }

  @Put(':id')
  updateEquipo(
    @Param('id') id: string,
    @Body() updateEquipoDto: Partial<CreateEquipoDto>,
  ) {
    return this.equiposService.updateEquipo(+id, updateEquipoDto);
  }

  @Delete(':id')
  removeEquipo(@Param('id') id: string) {
    return this.equiposService.removeEquipo(+id);
  }
}
