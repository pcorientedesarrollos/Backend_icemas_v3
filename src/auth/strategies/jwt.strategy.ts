import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'icemas-dev-secret-key-2024',
    });
  }

  async validate(payload: any) {
    console.log('🔑 JWT Strategy - Validating token payload:', payload);

    try {
      const user = await this.authService.validateUser(payload.sub);

      if (!user) {
        console.log('❌ JWT Strategy - User not found for ID:', payload.sub);
        return null;
      }

      console.log('✅ JWT Strategy - User validated:', {
        id: user.id,
        email: user.email,
        role: user.role,
      });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    } catch (error) {
      console.log('❌ JWT Strategy - Error during validation:', error.message);
      throw error;
    }
  }
}
