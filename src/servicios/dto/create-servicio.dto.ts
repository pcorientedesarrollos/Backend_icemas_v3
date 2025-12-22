import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  IsArray,
} from 'class-validator';

export class CreateServicioDto {
  @IsInt()
  @IsNotEmpty()
  idTecnico: number;

  @IsInt()
  @IsNotEmpty()
  idTipoServicio: number;

  @IsInt()
  @IsNotEmpty()
  idCliente: number;

  @IsInt()
  @IsNotEmpty()
  idSucursal: number;

  @IsInt({ each: true })
  @IsOptional()
  idsEquipos?: number[]; // Array of equipment IDs

  @IsInt()
  @IsOptional()
  idEquipo?: number; // Keep for backward compatibility

  @IsDateString()
  @IsNotEmpty()
  fechaServicio: string;

  @IsString()
  @IsOptional()
  tipo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  detalleTrabajo?: string;

  @IsString()
  @IsOptional()
  folio?: string;

  @IsString()
  @IsNotEmpty()
  estado: string; // 'Pendiente' | 'Completado' | 'Cancelado'
}
