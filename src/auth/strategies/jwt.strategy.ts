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
    try {
      const user = await this.authService.validateUser(payload.sub);

      if (!user) {
        return null;
      }

      return { id: user.id, email: user.email, name: user.name, role: user.role };
    } catch (error) {
      throw error;
    }
  }
}
