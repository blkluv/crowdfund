import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddOnDto, CreateRewardTierDto } from './dto/rewards.dto';

@Injectable()
export class RewardsService {
  constructor(@Inject('DATABASE_POOL') private pool: any) {}

  async listRewardTiers(projectId: string) {
    const result = await this.pool.query(
      `SELECT *
       FROM reward_tiers
       WHERE project_id = $1::uuid
       ORDER BY sort_order ASC, created_at ASC`,
      [projectId],
    );
    return result.rows;
  }

  async createRewardTier(projectId: string, dto: CreateRewardTierDto) {
    const result = await this.pool.query(
      `INSERT INTO reward_tiers (project_id, title, description, price, quantity_total, active)
       VALUES ($1::uuid, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        projectId,
        dto.title,
        dto.description ?? null,
        dto.price,
        dto.quantity_total ?? null,
        dto.active ?? true,
      ],
    );
    return result.rows[0];
  }

  async listAddOns(projectId: string) {
    const result = await this.pool.query(
      `SELECT *
       FROM add_ons
       WHERE project_id = $1::uuid
       ORDER BY created_at ASC`,
      [projectId],
    );
    return result.rows;
  }

  async createAddOn(projectId: string, dto: CreateAddOnDto) {
    const result = await this.pool.query(
      `INSERT INTO add_ons (project_id, title, description, price, quantity_total, active)
       VALUES ($1::uuid, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        projectId,
        dto.title,
        dto.description ?? null,
        dto.price,
        dto.quantity_total ?? null,
        dto.active ?? true,
      ],
    );
    return result.rows[0];
  }

  // Used by pledge flow for inventory checks
  async getRewardTierForUpdate(client: any, projectId: string, rewardTierId: string) {
    const result = await client.query(
      `SELECT *
       FROM reward_tiers
       WHERE id = $1::uuid AND project_id = $2::uuid
       FOR UPDATE`,
      [rewardTierId, projectId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException('Reward tier not found');
    if (!row.active) throw new BadRequestException('Reward tier is not active');
    if (row.quantity_total != null && Number(row.quantity_sold) + 1 > Number(row.quantity_total)) {
      throw new BadRequestException('Reward tier is sold out');
    }
    return row;
  }

  async getAddOnForUpdate(client: any, projectId: string, addOnId: string, quantity: number) {
    const result = await client.query(
      `SELECT *
       FROM add_ons
       WHERE id = $1::uuid AND project_id = $2::uuid
       FOR UPDATE`,
      [addOnId, projectId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException('Add-on not found');
    if (!row.active) throw new BadRequestException('Add-on is not active');
    if (row.quantity_total != null && Number(row.quantity_sold) + quantity > Number(row.quantity_total)) {
      throw new BadRequestException('Add-on is sold out');
    }
    return row;
  }
}

