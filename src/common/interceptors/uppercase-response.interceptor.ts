import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UppercaseResponseInterceptor implements NestInterceptor {
    // Fields that should be converted to uppercase
    private readonly uppercaseFields = [
        'nombre',
        'empresa',
        'modelo',
        'descripcion',
        'serie',
        'direccion',
        'contacto',
        'detalleTrabajo',
        'folio',
        'especialidad' // Added for Tecnico
    ];

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                return this.transformData(data);
            }),
        );
    }

    private transformData(data: any): any {
        if (!data) {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map((item) => this.transformData(item));
        }

        if (typeof data === 'object' && !(data instanceof Date)) {
            const newData = { ...data }; // Shallow copy to avoid mutating original if needed, but we are returning new structure usually.
            // Actually iterating keys is better
            Object.keys(newData).forEach((key) => {
                if (typeof newData[key] === 'string') {
                    if (this.uppercaseFields.includes(key)) {
                        newData[key] = newData[key].toUpperCase();
                    }
                } else if (typeof newData[key] === 'object') {
                    newData[key] = this.transformData(newData[key]);
                }
            });
            return newData;
        }

        return data;
    }
}
