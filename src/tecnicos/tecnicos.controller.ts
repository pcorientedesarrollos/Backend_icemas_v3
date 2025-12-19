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
import { TecnicosService } from './tecnicos.service';
import { CreateTecnicoDto } from './dto/create-tecnico.dto';
import { SaveSignatureDto } from '../servicios/dto/save-signature.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tecnicos')
@UseGuards(JwtAuthGuard)
export class TecnicosController {
  constructor(private readonly tecnicosService: TecnicosService) {}

  @Post()
  create(@Body() createTecnicoDto: CreateTecnicoDto) {
    return this.tecnicosService.create(createTecnicoDto);
  }

  @Get()
  findAll() {
    return this.tecnicosService.findAll();
  }

  @Get('autocomplete')
  autocomplete(@Query('term') term: string) {
    return this.tecnicosService.autocomplete(term || '');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tecnicosService.findOne(+id);
  }

  @Get(':id/servicios')
  getServicios(@Param('id') id: string) {
    return this.tecnicosService.getServicios(+id);
  }

  @Post(':id/firma')
  saveSignature(
    @Param('id') id: string,
    @Body() saveSignatureDto: SaveSignatureDto,
  ) {
    return this.tecnicosService.saveSignature(+id, saveSignatureDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTecnicoDto: Partial<CreateTecnicoDto>,
  ) {
    return this.tecnicosService.update(+id, updateTecnicoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tecnicosService.remove(+id);
  }
}
