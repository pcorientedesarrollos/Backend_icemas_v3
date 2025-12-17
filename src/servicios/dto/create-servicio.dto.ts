import { IsNotEmpty, IsString, IsInt, IsOptional, IsDateString } from 'class-validator';

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

    @IsInt()
    @IsNotEmpty()
    idEquipo: number;

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
    @IsNotEmpty()
    folio: string;

    @IsString()
    @IsNotEmpty()
    estado: string; // 'Pendiente' | 'En Proceso' | 'Completado' | 'Cancelado'
}
