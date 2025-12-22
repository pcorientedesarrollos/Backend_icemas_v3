import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserRoles1734899999999 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update existing users with old role values to new enum values
        await queryRunner.query(`
      UPDATE users 
      SET role = 'administrador' 
      WHERE role IN ('admin', 'administrator', 'ADMIN', 'ADMINISTRATOR')
    `);

        await queryRunner.query(`
      UPDATE users 
      SET role = 'tecnico' 
      WHERE role IN ('usuario', 'user', 'tecnico', 'technician', 'USUARIO', 'USER', 'TECNICO')
    `);

        // Set default role for any users without a valid role
        await queryRunner.query(`
      UPDATE users 
      SET role = 'tecnico' 
      WHERE role NOT IN ('administrador', 'tecnico') OR role IS NULL
    `);

        console.log('✅ User roles migration completed successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert roles back to old values if needed
        await queryRunner.query(`
      UPDATE users 
      SET role = 'usuario' 
      WHERE role = 'tecnico'
    `);

        await queryRunner.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE role = 'administrador'
    `);
    }
}
