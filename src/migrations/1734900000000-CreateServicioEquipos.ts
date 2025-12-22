import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateServicioEquipos1734900000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create servicio_equipos table
        await queryRunner.createTable(
            new Table({
                name: 'servicio_equipos',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'id_servicio',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'id_equipo',
                        type: 'int',
                        isNullable: false,
                    },
                ],
                indices: [
                    {
                        name: 'unique_servicio_equipo',
                        columnNames: ['id_servicio', 'id_equipo'],
                        isUnique: true,
                    },
                ],
            }),
            true,
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            'servicio_equipos',
            new TableForeignKey({
                columnNames: ['id_servicio'],
                referencedColumnNames: ['id_servicio'],
                referencedTableName: 'servicios',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'servicio_equipos',
            new TableForeignKey({
                columnNames: ['id_equipo'],
                referencedColumnNames: ['id_equipo'],
                referencedTableName: 'equipos',
                onDelete: 'CASCADE',
            }),
        );

        // Migrate existing data
        await queryRunner.query(`
      INSERT INTO servicio_equipos (id_servicio, id_equipo)
      SELECT id_servicio, id_equipo 
      FROM servicios 
      WHERE id_equipo IS NOT NULL
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('servicio_equipos');
    }
}
