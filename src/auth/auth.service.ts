import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { name, email, password } = registerDto;

        // Check if user already exists
        const existingUser = await this.usersRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new UnauthorizedException('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = this.usersRepository.create({
            name,
            email,
            password: hashedPassword,
            emailVerifiedAt: new Date(), // Auto-verify for now
        });

        await this.usersRepository.save(user);

        // Remove password from response
        const { password: _, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT token
        const payload = { sub: user.id, email: user.email, name: user.name };
        const accessToken = await this.jwtService.signAsync(payload);

        console.log('🔐 Login successful - Token generated for user:', {
            userId: user.id,
            email: user.email,
        });

        return {
            access_token: accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };
    }

    async validateUser(userId: number) {
        return this.usersRepository.findOne({ where: { id: userId } });
    }
}
