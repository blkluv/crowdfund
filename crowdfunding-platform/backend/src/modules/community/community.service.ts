import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateCommentDto, CreateUpdateDto } from './dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(@Inject('DATABASE_POOL') private pool: any) {}

  async listComments(projectId: string) {
    const result = await this.pool.query(
      `SELECT *
       FROM comments
       WHERE project_id = $1::uuid AND status <> 'deleted'
       ORDER BY created_at ASC
       LIMIT 500`,
      [projectId],
    );
    return result.rows;
  }

  async createComment(projectId: string, dto: CreateCommentDto) {
    if (!dto.user_id) throw new BadRequestException('user_id is required');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO comments (project_id, user_id, parent_id, body, status)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'approved')
         RETURNING *`,
        [projectId, dto.user_id, dto.parent_id ?? null, dto.body],
      );

      await client.query(
        `UPDATE projects SET comments_count = comments_count + 1 WHERE id = $1::uuid`,
        [projectId],
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async listUpdates(projectId: string) {
    const result = await this.pool.query(
      `SELECT *
       FROM updates
       WHERE project_id = $1::uuid
       ORDER BY created_at DESC
       LIMIT 200`,
      [projectId],
    );
    return result.rows;
  }

  async createUpdate(projectId: string, dto: CreateUpdateDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO updates (project_id, title, body_md, is_backers_only, published)
         VALUES ($1::uuid, $2, $3, $4, $5)
         RETURNING *`,
        [projectId, dto.title, dto.body_md, dto.is_backers_only ?? false, dto.published ?? false],
      );

      await client.query(
        `UPDATE projects SET updates_count = updates_count + 1 WHERE id = $1::uuid`,
        [projectId],
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
