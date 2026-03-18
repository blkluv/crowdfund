import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateAddOnDto, CreateRewardTierDto } from './dto/rewards.dto';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Rewards')
@Controller('projects/:projectId')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('reward-tiers')
  @ApiOperation({ summary: 'List reward tiers for a project' })
  @ApiParam({ name: 'projectId' })
  async listRewardTiers(@Param('projectId') projectId: string) {
    return this.rewardsService.listRewardTiers(projectId);
  }

  @Post('reward-tiers')
  @ApiOperation({ summary: 'Create a reward tier for a project' })
  @ApiParam({ name: 'projectId' })
  @ApiBody({ type: CreateRewardTierDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator', 'admin')
  async createRewardTier(@Param('projectId') projectId: string, @Body() dto: CreateRewardTierDto) {
    return this.rewardsService.createRewardTier(projectId, dto);
  }

  @Get('add-ons')
  @ApiOperation({ summary: 'List add-ons for a project' })
  @ApiParam({ name: 'projectId' })
  async listAddOns(@Param('projectId') projectId: string) {
    return this.rewardsService.listAddOns(projectId);
  }

  @Post('add-ons')
  @ApiOperation({ summary: 'Create an add-on for a project' })
  @ApiParam({ name: 'projectId' })
  @ApiBody({ type: CreateAddOnDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator', 'admin')
  async createAddOn(@Param('projectId') projectId: string, @Body() dto: CreateAddOnDto) {
    return this.rewardsService.createAddOn(projectId, dto);
  }
}
