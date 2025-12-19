import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  empresa: string;

  @IsString()
  @IsOptional()
  telefono?: string;
}
