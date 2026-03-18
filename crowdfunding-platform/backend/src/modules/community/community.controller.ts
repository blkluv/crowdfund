import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { CreateCommentDto, CreateUpdateDto } from './dto/community.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Community')
@Controller('projects/:projectId')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('comments')
  @ApiOperation({ summary: 'List comments for a project' })
  @ApiParam({ name: 'projectId' })
  async listComments(@Param('projectId') projectId: string) {
    return this.communityService.listComments(projectId);
  }

  @Post('comments')
  @ApiOperation({ summary: 'Create a comment for a project (dev helper; supply user_id)' })
  @ApiParam({ name: 'projectId' })
  @ApiBody({ type: CreateCommentDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createComment(@Param('projectId') projectId: string, @Body() dto: CreateCommentDto, @CurrentUser() user: CurrentUserPayload) {
    dto.user_id = dto.user_id ?? user.sub;
    return this.communityService.createComment(projectId, dto);
  }

  @Get('updates')
  @ApiOperation({ summary: 'List updates for a project' })
  @ApiParam({ name: 'projectId' })
  async listUpdates(@Param('projectId') projectId: string) {
    return this.communityService.listUpdates(projectId);
  }

  @Post('updates')
  @ApiOperation({ summary: 'Create an update for a project' })
  @ApiParam({ name: 'projectId' })
  @ApiBody({ type: CreateUpdateDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('creator', 'admin')
  async createUpdate(@Param('projectId') projectId: string, @Body() dto: CreateUpdateDto) {
    return this.communityService.createUpdate(projectId, dto);
  }
}
