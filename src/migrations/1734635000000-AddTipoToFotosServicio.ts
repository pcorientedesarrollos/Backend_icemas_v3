import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTipoToFotosServicio1734635000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`
                ALTER TABLE \`fotos_servicio\` 
                ADD COLUMN \`tipo\` VARCHAR(10) NOT NULL DEFAULT 'antes'
            `);
    } catch (error) {
      // Ignore if column already exists
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('Column "tipo" already exists in "fotos_servicio", skipping.');
        return;
      }
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`fotos_servicio\` 
      DROP COLUMN \`tipo\`
    `);
  }
}
