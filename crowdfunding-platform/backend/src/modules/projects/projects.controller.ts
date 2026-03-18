import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { AddMilestonesDto, CloseProjectDto, CreatePledgeDto, CreateProjectDto, LaunchProjectDto } from './dto/project.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects (latest first)' })
  async list() {
    return this.projectsService.listProjects();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search projects (Postgres ILIKE fallback)' })
  async search(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('funding_model') funding_model?: string,
    @Query('state') state?: string,
  ) {
    return this.projectsService.searchProjects({ q, category, funding_model, state });
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get project by id or slug' })
  @ApiParam({ name: 'idOrSlug' })
  async get(@Param('idOrSlug') idOrSlug: string) {
    return this.projectsService.getProject(idOrSlug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project (draft)' })
  @ApiBody({ type: CreateProjectDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator', 'admin')
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: CurrentUserPayload) {
    dto.creator_id = dto.creator_id ?? user.sub;
    return this.projectsService.createProject(dto);
  }

  @Post(':id/launch')
  @ApiOperation({ summary: 'Launch a project (draft/submitted -> live)' })
  @ApiBody({ type: LaunchProjectDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator', 'admin')
  async launch(@Param('id') projectId: string, @Body() dto: LaunchProjectDto) {
    return this.projectsService.launchProject(projectId, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a project (live -> succeeded/failed) and apply funding-model settlement' })
  @ApiBody({ type: CloseProjectDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator', 'admin')
  async close(@Param('id') projectId: string, @Body() dto: CloseProjectDto) {
    return this.projectsService.closeProject(projectId, dto);
  }

  @Post(':id/pledges')
  @ApiOperation({ summary: 'Create a pledge for a project (KIA pays immediately; AON/Milestone pending until close)' })
  @ApiBody({ type: CreatePledgeDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async pledge(@Param('id') projectId: string, @Body() dto: CreatePledgeDto, @CurrentUser() user: CurrentUserPayload) {
    dto.user_id = dto.user_id ?? user.sub;
    return this.projectsService.createPledge(projectId, dto);
  }

  @Post(':id/pledges/stripe-intent')
  @ApiOperation({ summary: 'Create a Stripe PaymentIntent-backed pledge (KIA only)' })
  @ApiBody({ type: CreatePledgeDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async pledgeStripeIntent(@Param('id') projectId: string, @Body() dto: CreatePledgeDto, @CurrentUser() user: CurrentUserPayload) {
    // user_id is derived from JWT for this flow
    return this.projectsService.createStripePledgeIntent(projectId, user.sub, dto as any);
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Set milestones (milestone funding_model only)' })
  @ApiBody({ type: AddMilestonesDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator', 'admin')
  async setMilestones(@Param('id') projectId: string, @Body() dto: AddMilestonesDto) {
    return this.projectsService.setMilestones(projectId, dto);
  }

  @Post(':id/milestones/:milestoneId/approve')
  @ApiOperation({ summary: 'Approve a milestone and schedule a disbursement (milestone funding_model only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator', 'admin')
  async approveMilestone(@Param('id') projectId: string, @Param('milestoneId') milestoneId: string) {
    return this.projectsService.approveMilestone(projectId, milestoneId);
  }
}
