import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTipoToFotosServicio1734635000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`fotos_servicio\` 
      ADD COLUMN \`tipo\` VARCHAR(10) NOT NULL DEFAULT 'antes'
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`fotos_servicio\` 
      DROP COLUMN \`tipo\`
    `);
    }
}
