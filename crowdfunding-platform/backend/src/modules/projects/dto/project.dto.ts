import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export const FUNDING_MODELS = ['aon', 'kia', 'milestone'] as const;
export type FundingModel = (typeof FUNDING_MODELS)[number];

export class CreateMilestoneDto {
  @ApiProperty({ example: 'Prototype delivery' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  due_at?: string;
}

export class CreateProjectDto {
  @ApiPropertyOptional({ example: '2a2c0a7f-7a44-4b8f-ae7d-1c9b8c4d0b88', description: 'Optional when using JWT auth' })
  @IsOptional()
  @IsString()
  creator_id?: string;

  @ApiProperty({ example: 'Awesome Smart Wallet' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'awesome-smart-wallet' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiProperty({ example: 'Tech' })
  @IsString()
  @MaxLength(50)
  category!: string;

  @ApiPropertyOptional({ example: 'Gadgets' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subcategory?: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(1)
  goal_amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ enum: FUNDING_MODELS, example: 'aon' })
  @IsIn(FUNDING_MODELS as unknown as string[])
  funding_model!: FundingModel;

  @ApiProperty({ example: '2026-04-30T00:00:00.000Z' })
  @IsDateString()
  deadline!: string;

  @ApiPropertyOptional({ example: '## Story\\nMarkdown...' })
  @IsOptional()
  @IsString()
  story_md?: string;

  @ApiPropertyOptional({ example: '## Risks\\nMarkdown...' })
  @IsOptional()
  @IsString()
  risks_md?: string;

  @ApiPropertyOptional({ type: [CreateMilestoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneDto)
  milestones?: CreateMilestoneDto[];
}

export class LaunchProjectDto {
  @ApiPropertyOptional({ example: true, description: 'Skip state checks (admin tooling)' })
  @IsOptional()
  force?: boolean;
}

export class CloseProjectDto {
  @ApiPropertyOptional({ example: true, description: 'Close even if deadline is in the future' })
  @IsOptional()
  force?: boolean;
}

export class PledgeAddOnDto {
  @ApiProperty({ example: '0f0a3d1f-1b9f-4d44-b2a0-2f2f2d1b4f09' })
  @IsString()
  add_on_id!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreatePledgeDto {
  @ApiPropertyOptional({ example: 'c38b4a2e-5be2-4da5-8d3b-8e3e6c2a6a6a', description: 'Optional when using JWT auth' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ example: 'a33c07d1-6cf4-4a25-b4e2-7c6c9a7cb8e3' })
  @IsOptional()
  @IsString()
  reward_tier_id?: string;

  @ApiPropertyOptional({
    example: [{ add_on_id: '0f0a3d1f-1b9f-4d44-b2a0-2f2f2d1b4f09', quantity: 2 }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PledgeAddOnDto)
  add_ons?: PledgeAddOnDto[];

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}

export class AddMilestonesDto {
  @ApiProperty({ type: [CreateMilestoneDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneDto)
  milestones!: CreateMilestoneDto[];
}
