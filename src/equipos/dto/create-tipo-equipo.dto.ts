import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateTipoEquipoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
