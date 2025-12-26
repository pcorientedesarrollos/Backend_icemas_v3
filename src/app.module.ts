import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesModule } from './clientes/clientes.module';
import { TecnicosModule } from './tecnicos/tecnicos.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { EquiposModule } from './equipos/equipos.module';
import { ServiciosModule } from './servicios/servicios.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRoot({
      type: (process.env.DB_TYPE as any) || 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'icemas',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING === 'true',
      // Retry connection on failure
      retryAttempts: 10,
      retryDelay: 3000, // 3 seconds between retries
      // Remote MySQL connection settings
      extra: {
        connectionLimit: 10,
        connectTimeout: 60000, // 60 seconds
        acquireTimeout: 60000,
        timeout: 60000,
        // Keep connection alive - important for cloud databases
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000, // 10 seconds
      },
      // SSL for remote connections (try without first, then enable if needed)
      ssl:
        process.env.DB_HOST !== 'localhost'
          ? {
            rejectUnauthorized: false, // Allow self-signed certificates
          }
          : false,
    }),

    // Common Module (global)
    CommonModule,

    // Feature Modules
    AuthModule,
    ClientesModule,
    SucursalesModule,
    EquiposModule,
    ServiciosModule,
    TecnicosModule,
    UsersModule,
    NotificationsModule,
  ],
})
export class AppModule { }
