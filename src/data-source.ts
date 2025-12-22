import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root', // Changed from DB_USERNAME to DB_USER to match app.module.ts
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'icemas', // Changed from DB_DATABASE to DB_NAME to match app.module.ts
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    // Add SSL configuration matching app.module.ts
    ssl: process.env.DB_HOST !== 'localhost'
        ? { rejectUnauthorized: false }
        : false,
});
