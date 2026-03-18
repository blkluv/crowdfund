import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  constructor(@Inject('DATABASE_POOL') private pool: any) {}

  async overview() {
    const [projects, pledges, byModel] = await Promise.all([
      this.pool.query(
        `SELECT
           COUNT(*)::int AS total_projects,
           COUNT(*) FILTER (WHERE state = 'live')::int AS live_projects,
           COUNT(*) FILTER (WHERE state = 'succeeded')::int AS succeeded_projects,
           COUNT(*) FILTER (WHERE state = 'failed')::int AS failed_projects
         FROM projects`,
      ),
      this.pool.query(
        `SELECT
           COUNT(*)::int AS total_pledges,
           COALESCE(SUM(total_amount), 0) AS total_raised,
           COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_pledges,
           COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_pledges
         FROM pledges`,
      ),
      this.pool.query(
        `SELECT funding_model, COUNT(*)::int AS projects
         FROM projects
         GROUP BY funding_model
         ORDER BY funding_model`,
      ),
    ]);

    return {
      projects: projects.rows[0],
      pledges: pledges.rows[0],
      by_funding_model: byModel.rows,
    };
  }
}

