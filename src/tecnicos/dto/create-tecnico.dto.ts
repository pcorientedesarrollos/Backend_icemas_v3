import { IsNotEmpty, IsString, IsEmail, IsInt, IsOptional } from 'class-validator';

export class CreateTecnicoDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    telefono: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    especialidad: string;

    @IsInt()
    @IsNotEmpty()
    activo: number;

    @IsString()
    @IsOptional()
    firma?: string;
}
