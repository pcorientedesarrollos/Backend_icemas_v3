import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateMarcaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
