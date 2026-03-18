import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

import { UsersService } from '../users/users.service';
import { EmailService } from '../../email/email.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, display_name, role } = registerDto;
    
    // Check if user exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const devMode = this.configService.get<string>('DEV_MODE', 'false') === 'true';
    const user = await this.usersService.create({
      email,
      hashed_password: hashedPassword,
      role: devMode && role ? role : 'backer',
    });

    // Create profile
    await this.usersService.createProfile(user.id, { display_name });

    // Send verification email
    const verificationToken = this.generateVerificationToken(user.id);
    await this.emailService.sendVerificationEmail(email, verificationToken);

    // Generate tokens
    const tokens = this.generateTokens(user);
    
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);
    
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async handleOAuthCallback(profile: any) {
    let user = await this.usersService.findByEmail(profile.email);
    
    if (!user) {
      // Create new user from OAuth profile
      user = await this.usersService.create({
        email: profile.email,
        role: 'backer',
        email_verified: true,
        oauth_providers: { [profile.provider]: profile.id },
      });

      await this.usersService.createProfile(user.id, {
        display_name: profile.displayName,
        avatar_url: profile.photos?.[0]?.value,
      });
    } else {
      // Update OAuth provider info
      await this.usersService.update(user.id, {
        oauth_providers: {
          ...user.oauth_providers,
          [profile.provider]: profile.id,
        },
      });
    }

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    // In production, you might want to blacklist the token
    // For now, just return success
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = uuid();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.createPasswordReset(user.id, resetToken, expiresAt);
    await this.emailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const reset = await this.usersService.findPasswordReset(token);
    if (!reset || reset.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.usersService.update(reset.user_id, {
      hashed_password: hashedPassword,
    });

    await this.usersService.deletePasswordReset(token);

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    // Decode and verify the token
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      await this.usersService.update(payload.sub, {
        email_verified: true,
      });

      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid verification token');
    }
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    };
  }

  private generateVerificationToken(userId: string) {
    return this.jwtService.sign(
      { sub: userId, purpose: 'email_verification' },
      { expiresIn: '24h' }
    );
  }

  private sanitizeUser(user: any) {
    const { hashed_password, ...sanitized } = user;
    return sanitized;
  }
}
