import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(200)
  password!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  display_name!: string;

  @ApiPropertyOptional({ description: 'DEV_MODE only', enum: ['backer', 'creator', 'admin', 'moderator'] })
  @IsOptional()
  @IsIn(['backer', 'creator', 'admin', 'moderator'])
  role?: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

