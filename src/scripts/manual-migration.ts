import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function run() {
    console.log('Starting manual migration (snake_case version)...');

    // Load .env
    const envPath = path.join(__dirname, '../../.env');
    dotenv.config({ path: envPath });

    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'icemas',
        ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined
    };

    console.log('Connecting to database...');

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Connected!');

        // 1. Create table with snake_case columns
        console.log('Creating table servicio_equipos...');
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`servicio_equipos\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`id_servicio\` int NOT NULL,
        \`id_equipo\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_servicio_equipo\` (\`id_servicio\`,\`id_equipo\`),
        KEY \`FK_servicio_equipos_servicio\` (\`id_servicio\`),
        KEY \`FK_servicio_equipos_equipo\` (\`id_equipo\`),
        CONSTRAINT \`FK_servicio_equipos_equipo\` FOREIGN KEY (\`id_equipo\`) REFERENCES \`equipos\` (\`id_equipo\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_servicio_equipos_servicio\` FOREIGN KEY (\`id_servicio\`) REFERENCES \`servicios\` (\`id_servicio\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
        console.log('Table created or already exists.');

        // 2. Migrate data using snake_case columns
        console.log('Migrating existing data...');
        try {
            const [rows] = await connection.execute('SELECT id_servicio, id_equipo FROM servicios WHERE id_equipo IS NOT NULL');
            const services = rows as any[];

            console.log(`Found ${services.length} services to migrate.`);

            let migratedCount = 0;
            for (const service of services) {
                try {
                    await connection.execute(
                        'INSERT IGNORE INTO servicio_equipos (id_servicio, id_equipo) VALUES (?, ?)',
                        [service.id_servicio, service.id_equipo]
                    );
                    migratedCount++;
                } catch (err) {
                    console.error(`Failed to migrate service ${service.id_servicio}:`, err.message);
                }
            }
            console.log(`Migrated ${migratedCount} relations.`);
        } catch (err) {
            console.log('Could not migrate data:', err.message);
        }

        // 3. Optional: Fix fotos_servicio if needed
        try {
            await connection.execute("ALTER TABLE `fotos_servicio` ADD COLUMN `tipo` VARCHAR(10) NOT NULL DEFAULT 'antes'");
            console.log('Added column tipo to fotos_servicio');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column tipo already exists in fotos_servicio (OK)');
            } else {
                console.error('Error modifying fotos_servicio:', err.message);
            }
        }

        console.log('Manual migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

run();
