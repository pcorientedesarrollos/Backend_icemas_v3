import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateEquipoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  modelo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @IsNotEmpty()
  idMarca: number;

  @IsInt()
  @IsNotEmpty()
  idTipo: number;

  @IsInt()
  @IsNotEmpty()
  idCliente: number;

  @IsInt()
  @IsNotEmpty()
  idSucursal: number;

  @IsInt()
  @IsNotEmpty()
  estado: number;

  @IsString()
  @IsOptional()
  serie?: string;
}
