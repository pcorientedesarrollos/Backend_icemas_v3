import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSucursalDto {
  @IsInt()
  @IsNotEmpty()
  idCliente: number;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  contacto?: string;
}
