import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiPropertyOptional({ example: 'c38b4a2e-5be2-4da5-8d3b-8e3e6c2a6a6a', description: 'Optional when using JWT auth' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ example: '5e7791e7-6b28-4a63-b9ab-0f6d0f3a5c75' })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiProperty({ example: 'This looks great. When is the first shipment?' })
  @IsString()
  @MaxLength(2000)
  body!: string;
}

export class CreateUpdateDto {
  @ApiProperty({ example: 'Prototype Update' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: '## We built it\\nMore details...' })
  @IsString()
  body_md!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_backers_only?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
