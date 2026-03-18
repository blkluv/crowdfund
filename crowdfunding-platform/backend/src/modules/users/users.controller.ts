import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class UpdateUserRoleDto {
  @IsString()
  @IsIn(['backer', 'creator', 'admin', 'moderator'])
  role!: string;
}

class UpdateKycStatusDto {
  @IsString()
  @IsIn(['pending', 'approved', 'rejected', 'required'])
  kyc_status!: string;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (dev helper)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async list() {
    return this.usersService.listUsers();
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update a user role (dev helper)' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async setRole(@Param('id') userId: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.update(userId, { role: dto.role });
  }

  @Patch(':id/kyc-status')
  @ApiOperation({ summary: 'Update a user KYC status' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateKycStatusDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async setKycStatus(@Param('id') userId: string, @Body() dto: UpdateKycStatusDto) {
    return this.usersService.update(userId, { kyc_status: dto.kyc_status });
  }
}
