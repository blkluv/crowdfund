import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { CurrentUser, CurrentUserPayload } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  async me(@CurrentUser() user: CurrentUserPayload) {
    const full = await this.usersService.findById(user.sub);
    if (!full) return user;
    const { hashed_password, ...sanitized } = full;
    return sanitized;
  }

  @Post('kyc/submit')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit KYC info (stores business_info; sets kyc_status=pending)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        business_info: { type: 'object' },
        country: { type: 'string', example: 'IN' },
      },
    },
  })
  async submitKyc(@CurrentUser() user: CurrentUserPayload, @Body() body: any) {
    await this.usersService.update(user.sub, { kyc_status: 'pending', country: body?.country ?? null });
    const creator = await this.usersService.upsertCreator(user.sub, body?.business_info ?? {});
    return { message: 'KYC submitted', creator };
  }

  @Get('kyc')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current KYC status and creator profile' })
  async getKyc(@CurrentUser() user: CurrentUserPayload) {
    const u = await this.usersService.findById(user.sub);
    const creator = await this.usersService.getCreator(user.sub);
    return { kyc_status: u?.kyc_status, creator };
  }
}
