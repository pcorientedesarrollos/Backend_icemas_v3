import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';

async function createAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  try {
    const admin = await authService.register({
      name: 'Administrador',
      email: 'admin@icemas.com',
      password: 'Admin123!',
    });

    console.log('✅ Admin user created successfully:', admin);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);

    // Try to login with existing credentials
    try {
      const result = await authService.login({
        email: 'admin@icemas.com',
        password: 'Admin123!',
      });
      console.log('✅ Admin user already exists and can login');
    } catch (loginError) {
      console.error('❌ Could not login with default credentials');
    }
  }

  await app.close();
}

createAdmin();
