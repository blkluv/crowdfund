import { Controller, Param, Sse } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { map } from 'rxjs/operators';
import { RealtimeService } from './realtime.service';

@ApiTags('Realtime')
@Controller()
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Sse('projects/:id/stream')
  @ApiOperation({ summary: 'Server-Sent Events stream for project realtime updates' })
  @ApiParam({ name: 'id' })
  streamProject(@Param('id') projectId: string) {
    return this.realtimeService.streamProject(projectId).pipe(map((data) => ({ data })));
  }
}

