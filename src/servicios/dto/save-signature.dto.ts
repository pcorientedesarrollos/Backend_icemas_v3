import { IsNotEmpty, IsString } from 'class-validator';

export class SaveSignatureDto {
    @IsString()
    @IsNotEmpty()
    signature: string; // Base64 encoded PNG
}
