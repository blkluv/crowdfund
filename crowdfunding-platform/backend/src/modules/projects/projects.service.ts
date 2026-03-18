import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { AddMilestonesDto, CloseProjectDto, CreatePledgeDto, CreateProjectDto, FundingModel, LaunchProjectDto } from './dto/project.dto';
import { RewardsService } from '../rewards/rewards.service';
import { RealtimeService } from '../realtime/realtime.service';
import { StripeService } from '../payments/stripe.service';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

type ProjectRow = {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string | null;
  goal_amount: string;
  currency: string;
  funding_model: FundingModel;
  deadline: string;
  state: string;
  current_amount: string;
  backers_count: number;
  timeline: any;
  launch_date: string | null;
};

@Injectable()
export class ProjectsService {
  constructor(
    @Inject('DATABASE_POOL') private pool: any,
    private readonly rewardsService: RewardsService,
    private readonly realtimeService: RealtimeService,
    private readonly stripeService: StripeService,
  ) {}

  async listProjects() {
    const result = await this.pool.query(
      `SELECT id, creator_id, title, slug, category, subcategory, goal_amount, currency, funding_model, deadline, state,
              current_amount, backers_count, launch_date
       FROM projects
       ORDER BY created_at DESC
       LIMIT 100`,
    );
    return result.rows;
  }

  async searchProjects(params: { q?: string; category?: string; funding_model?: string; state?: string }) {
    const values: any[] = [];
    const where: string[] = [];

    if (params.q) {
      values.push(`%${params.q}%`);
      where.push(`(title ILIKE $${values.length} OR story_md ILIKE $${values.length} OR slug ILIKE $${values.length})`);
    }
    if (params.category) {
      values.push(params.category);
      where.push(`category = $${values.length}`);
    }
    if (params.funding_model) {
      values.push(params.funding_model);
      where.push(`funding_model = $${values.length}`);
    }
    if (params.state) {
      values.push(params.state);
      where.push(`state = $${values.length}`);
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT id, creator_id, title, slug, category, subcategory, goal_amount, currency, funding_model, deadline, state,
              current_amount, backers_count, launch_date
       FROM projects
       ${clause}
       ORDER BY created_at DESC
       LIMIT 100`,
      values,
    );
    return result.rows;
  }

  async getProject(idOrSlug: string) {
    const result = await this.pool.query(
      `SELECT *
       FROM projects
       WHERE id = $1::uuid OR slug = $1
       LIMIT 1`,
      [idOrSlug],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException('Project not found');
    return row;
  }

  async createProject(dto: CreateProjectDto) {
    if (!dto.creator_id) throw new BadRequestException('creator_id is required');
    const currency = (dto.currency ?? 'USD').toUpperCase();
    const deadline = new Date(dto.deadline);
    if (Number.isNaN(deadline.getTime())) throw new BadRequestException('Invalid deadline');
    if (deadline.getTime() <= Date.now()) throw new BadRequestException('Deadline must be in the future');

    const baseSlug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    if (!baseSlug) throw new BadRequestException('Could not generate a slug');

    const timeline =
      dto.funding_model === 'milestone' && dto.milestones?.length
        ? dto.milestones.map((m) => ({
            id: uuid(),
            title: m.title,
            amount: m.amount,
            due_at: m.due_at ?? null,
            status: 'pending',
          }))
        : [];

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let slug = baseSlug;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const result = await client.query<ProjectRow>(
            `INSERT INTO projects
              (creator_id, title, slug, category, subcategory, goal_amount, currency, funding_model, deadline, state, story_md, risks_md, timeline)
             VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, $11, $12::jsonb)
             RETURNING *`,
            [
              dto.creator_id,
              dto.title,
              slug,
              dto.category,
              dto.subcategory ?? null,
              dto.goal_amount,
              currency,
              dto.funding_model,
              deadline.toISOString(),
              dto.story_md ?? null,
              dto.risks_md ?? null,
              JSON.stringify(timeline),
            ],
          );
          await client.query('COMMIT');
          return result.rows[0];
        } catch (err: any) {
          // Unique violation on slug.
          if (err?.code === '23505') {
            slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
            continue;
          }
          throw err;
        }
      }

      throw new BadRequestException('Could not allocate a unique slug');
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async launchProject(projectId: string, _dto: LaunchProjectDto) {
    const project = await this.getProject(projectId);
    if (!['draft', 'submitted'].includes(project.state)) {
      throw new BadRequestException(`Cannot launch project from state "${project.state}"`);
    }

    const devMode = process.env.DEV_MODE === 'true';
    if (!devMode) {
      const creator = await this.pool.query(`SELECT kyc_status FROM users WHERE id = $1::uuid`, [project.creator_id]);
      const status = creator.rows[0]?.kyc_status;
      if (status !== 'approved') {
        throw new BadRequestException('Creator KYC must be approved before launching a project');
      }
    }

    const result = await this.pool.query(
      `UPDATE projects
       SET state = 'live', launch_date = NOW()
       WHERE id = $1::uuid
       RETURNING *`,
      [project.id],
    );
    this.realtimeService.emit(project.id, { type: 'state', project_id: project.id, state: 'live' });
    return result.rows[0];
  }

  async closeProject(projectId: string, dto: CloseProjectDto) {
    const project: ProjectRow = await this.getProject(projectId);
    if (project.state !== 'live') {
      throw new BadRequestException(`Cannot close project from state "${project.state}"`);
    }

    const deadline = new Date(project.deadline);
    if (!dto.force && Date.now() < deadline.getTime()) {
      throw new BadRequestException('Cannot close project before deadline (set force=true to override)');
    }

    const goal = Number(project.goal_amount);
    const current = Number(project.current_amount);
    const succeeded = project.funding_model === 'kia' ? true : current >= goal;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const nextState = succeeded ? 'succeeded' : 'failed';
      const updatedProject = await client.query(
        `UPDATE projects SET state = $2 WHERE id = $1::uuid RETURNING *`,
        [project.id, nextState],
      );

      if (project.funding_model !== 'kia') {
        // AON/Milestone: pledges start as pending, then become paid on success, failed on failure.
        await client.query(
          `UPDATE pledges
           SET status = $2, updated_at = NOW()
           WHERE project_id = $1::uuid AND status = 'pending'`,
          [project.id, succeeded ? 'paid' : 'failed'],
        );
      }

      await client.query('COMMIT');
      this.realtimeService.emit(project.id, { type: 'state', project_id: project.id, state: nextState });
      return updatedProject.rows[0];
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async createPledge(projectId: string, dto: CreatePledgeDto) {
    if (!dto.user_id) throw new BadRequestException('user_id is required');
    const project: ProjectRow = await this.getProject(projectId);
    if (project.state !== 'live') {
      throw new BadRequestException('Project is not live');
    }

    const pledgeCurrency = (dto.currency ?? project.currency ?? 'USD').toUpperCase();
    if (pledgeCurrency !== (project.currency ?? 'USD').toUpperCase()) {
      throw new BadRequestException('Currency mismatch');
    }

    const pledgeStatus = project.funding_model === 'kia' ? 'paid' : 'pending';

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const existingBacker = await client.query(
        `SELECT 1 FROM pledges WHERE project_id = $1::uuid AND user_id = $2::uuid LIMIT 1`,
        [project.id, dto.user_id],
      );
      const isNewBacker = existingBacker.rows.length === 0;

      let addOnsTotal = 0;
      const addOnRows: Array<{ id: string; price: string; quantity: number }> = [];
      if (dto.add_ons?.length) {
        for (const addOn of dto.add_ons) {
          if (addOn.quantity <= 0) throw new BadRequestException('Invalid add-on quantity');
          const row = await this.rewardsService.getAddOnForUpdate(client, project.id, addOn.add_on_id, addOn.quantity);
          addOnsTotal += Number(row.price) * addOn.quantity;
          addOnRows.push({ id: row.id, price: row.price, quantity: addOn.quantity });
  }

  async createStripePledgeIntent(projectId: string, userId: string, dto: Omit<CreatePledgeDto, 'user_id'>) {
    const project: ProjectRow = await this.getProject(projectId);
    if (project.state !== 'live') throw new BadRequestException('Project is not live');
    if (project.funding_model !== 'kia') throw new BadRequestException('Stripe intent flow is currently supported for KIA only');

    const pledgeCurrency = ((dto.currency ?? project.currency ?? 'USD') as string).toUpperCase();
    if (pledgeCurrency !== (project.currency ?? 'USD').toUpperCase()) throw new BadRequestException('Currency mismatch');

    const client = await this.pool.connect();
    let pledgeRow: any;
    let totalAmount = 0;
    try {
      await client.query('BEGIN');

      let addOnsTotal = 0;
      const addOnRows: Array<{ id: string; price: string; quantity: number }> = [];
      if (dto.add_ons?.length) {
        for (const addOn of dto.add_ons) {
          if (addOn.quantity <= 0) throw new BadRequestException('Invalid add-on quantity');
          const row = await this.rewardsService.getAddOnForUpdate(client, project.id, addOn.add_on_id, addOn.quantity);
          addOnsTotal += Number(row.price) * addOn.quantity;
          addOnRows.push({ id: row.id, price: row.price, quantity: addOn.quantity });
        }
      }

      let rewardTierRow: any | null = null;
      if (dto.reward_tier_id) {
        rewardTierRow = await this.rewardsService.getRewardTierForUpdate(client, project.id, dto.reward_tier_id);
        const minAmount = Number(rewardTierRow.price);
        if (dto.amount < minAmount) throw new BadRequestException(`Pledge amount must be at least ${minAmount} for the selected reward tier`);
      }

      totalAmount = dto.amount + addOnsTotal;

      const pledge = await client.query(
        `INSERT INTO pledges (project_id, user_id, reward_tier_id, amount, currency, status, total_amount)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'pending', $6)
         RETURNING *`,
        [project.id, userId, dto.reward_tier_id ?? null, dto.amount, pledgeCurrency, totalAmount],
      );
      pledgeRow = pledge.rows[0];

      if (rewardTierRow) {
        await client.query(
          `INSERT INTO pledge_items (pledge_id, reward_tier_id, quantity, unit_price, total_price)
           VALUES ($1::uuid, $2::uuid, 1, $3, $3)`,
          [pledgeRow.id, rewardTierRow.id, rewardTierRow.price],
        );
        await client.query(`UPDATE reward_tiers SET quantity_sold = quantity_sold + 1 WHERE id = $1::uuid`, [rewardTierRow.id]);
      }

      for (const addOnRow of addOnRows) {
        const totalPrice = Number(addOnRow.price) * addOnRow.quantity;
        await client.query(
          `INSERT INTO pledge_items (pledge_id, add_on_id, quantity, unit_price, total_price)
           VALUES ($1::uuid, $2::uuid, $3, $4, $5)`,
          [pledgeRow.id, addOnRow.id, addOnRow.quantity, addOnRow.price, totalPrice],
        );
        await client.query(
          `UPDATE add_ons SET quantity_sold = quantity_sold + $2 WHERE id = $1::uuid`,
          [addOnRow.id, addOnRow.quantity],
        );
      }

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // Create Stripe payment intent after DB commit; if it fails, mark pledge failed and release inventory.
    try {
      const amountMinor = Math.round(Number(totalAmount) * 100);
      const intent = await this.stripeService.client.paymentIntents.create({
        amount: amountMinor,
        currency: pledgeCurrency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          pledge_id: pledgeRow.id,
          project_id: project.id,
          user_id: userId,
        },
      });

      await this.pool.query(
        `UPDATE pledges SET payment_intent_id = $2, updated_at = NOW() WHERE id = $1::uuid`,
        [pledgeRow.id, intent.id],
      );
      await this.pool.query(
        `INSERT INTO payments (pledge_id, provider, intent_id, status, amount, currency)
         VALUES ($1::uuid, 'stripe', $2, $3, $4, $5)`,
        [pledgeRow.id, intent.id, intent.status, pledgeRow.total_amount, pledgeRow.currency],
      );

      return { pledge: { ...pledgeRow, payment_intent_id: intent.id }, client_secret: intent.client_secret };
    } catch (e: any) {
      // Best-effort revert
      await this.pool.query(`UPDATE pledges SET status = 'failed', updated_at = NOW() WHERE id = $1::uuid`, [pledgeRow.id]);
      throw e;
    }
  }
}

      let rewardTierRow: any | null = null;
      if (dto.reward_tier_id) {
        rewardTierRow = await this.rewardsService.getRewardTierForUpdate(client, project.id, dto.reward_tier_id);
        const minAmount = Number(rewardTierRow.price);
        if (dto.amount < minAmount) {
          throw new BadRequestException(`Pledge amount must be at least ${minAmount} for the selected reward tier`);
        }
      }

      const totalAmount = dto.amount + addOnsTotal;

      const pledge = await client.query(
        `INSERT INTO pledges (project_id, user_id, reward_tier_id, amount, currency, status, total_amount)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7)
         RETURNING *`,
        [
          project.id,
          dto.user_id,
          dto.reward_tier_id ?? null,
          dto.amount,
          pledgeCurrency,
          pledgeStatus,
          totalAmount,
        ],
      );

      const pledgeId = pledge.rows[0].id;

      if (rewardTierRow) {
        await client.query(
          `INSERT INTO pledge_items (pledge_id, reward_tier_id, quantity, unit_price, total_price)
           VALUES ($1::uuid, $2::uuid, 1, $3, $3)`,
          [pledgeId, rewardTierRow.id, rewardTierRow.price],
        );

        await client.query(
          `UPDATE reward_tiers SET quantity_sold = quantity_sold + 1 WHERE id = $1::uuid`,
          [rewardTierRow.id],
        );
      }

      for (const addOnRow of addOnRows) {
        const totalPrice = Number(addOnRow.price) * addOnRow.quantity;
        await client.query(
          `INSERT INTO pledge_items (pledge_id, add_on_id, quantity, unit_price, total_price)
           VALUES ($1::uuid, $2::uuid, $3, $4, $5)`,
          [pledgeId, addOnRow.id, addOnRow.quantity, addOnRow.price, totalPrice],
        );

        await client.query(
          `UPDATE add_ons SET quantity_sold = quantity_sold + $2 WHERE id = $1::uuid`,
          [addOnRow.id, addOnRow.quantity],
        );
      }

      const projectUpdate = await client.query(
        `UPDATE projects
         SET current_amount = current_amount + $2,
             backers_count = backers_count + $3
         WHERE id = $1::uuid
         RETURNING current_amount, backers_count`,
        [project.id, totalAmount, isNewBacker ? 1 : 0],
      );

      await client.query('COMMIT');
      const updated = projectUpdate.rows[0];
      if (updated) {
        this.realtimeService.emit(project.id, {
          type: 'funding',
          project_id: project.id,
          current_amount: updated.current_amount,
          backers_count: Number(updated.backers_count ?? 0),
        });
      }
      return pledge.rows[0];
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async setMilestones(projectId: string, dto: AddMilestonesDto) {
    const project: ProjectRow = await this.getProject(projectId);
    if (project.funding_model !== 'milestone') {
      throw new BadRequestException('Project funding_model is not milestone');
    }
    if (!['draft', 'submitted'].includes(project.state)) {
      throw new BadRequestException(`Cannot set milestones from state "${project.state}"`);
    }

    const timeline = dto.milestones.map((m) => ({
      id: uuid(),
      title: m.title,
      amount: m.amount,
      due_at: m.due_at ?? null,
      status: 'pending',
    }));

    const result = await this.pool.query(
      `UPDATE projects SET timeline = $2::jsonb WHERE id = $1::uuid RETURNING *`,
      [project.id, JSON.stringify(timeline)],
    );
    return result.rows[0];
  }

  async approveMilestone(projectId: string, milestoneId: string) {
    const project: ProjectRow = await this.getProject(projectId);
    if (project.funding_model !== 'milestone') {
      throw new BadRequestException('Project funding_model is not milestone');
    }
    if (project.state !== 'succeeded' && project.state !== 'paid') {
      throw new BadRequestException('Milestones can be approved after a successful campaign close');
    }

    const timeline = Array.isArray(project.timeline) ? project.timeline : [];
    const milestone = timeline.find((m: any) => m?.id === milestoneId);
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status === 'approved') {
      return { message: 'Already approved' };
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      milestone.status = 'approved';
      milestone.approved_at = new Date().toISOString();

      await client.query(
        `UPDATE projects SET timeline = $2::jsonb WHERE id = $1::uuid`,
        [project.id, JSON.stringify(timeline)],
      );

      await client.query(
        `INSERT INTO disbursements (project_id, amount, currency, status, scheduled_at)
         VALUES ($1::uuid, $2, $3, 'scheduled', NOW())`,
        [project.id, milestone.amount, project.currency],
      );

      await client.query('COMMIT');
      return { message: 'Milestone approved', milestone };
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
