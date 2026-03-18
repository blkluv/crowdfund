import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(@Inject('DATABASE_POOL') private pool: any) {}

  async listUsers() {
    const result = await this.pool.query(
      `SELECT id, email, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 100`,
    );
    return result.rows;
  }

  async findById(userId: string) {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0];
  }

  async findByEmail(email: string) {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  async create(userData: any) {
    const result = await this.pool.query(
      `INSERT INTO users (id, email, hashed_password, role, email_verified, oauth_providers)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userData.email,
        userData.hashed_password ?? null,
        userData.role ?? 'backer',
        userData.email_verified ?? false,
        userData.oauth_providers ?? {},
      ]
    );
    return result.rows[0];
  }

  async createProfile(userId: string, profileData: any) {
    const result = await this.pool.query(
      `INSERT INTO profiles (user_id, display_name, bio, avatar_url, social_links)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        profileData.display_name ?? null,
        profileData.bio ?? null,
        profileData.avatar_url ?? null,
        profileData.social_links ?? {},
      ],
    );
    return result.rows[0];
  }

  async update(userId: string, data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

    const result = await this.pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, userId],
    );
    return result.rows[0];
  }

  async upsertCreator(userId: string, businessInfo: any) {
    const result = await this.pool.query(
      `INSERT INTO creators (user_id, business_info, verification_status)
       VALUES ($1::uuid, $2::jsonb, 'pending')
       ON CONFLICT (user_id) DO UPDATE SET business_info = EXCLUDED.business_info, updated_at = NOW()
       RETURNING *`,
      [userId, JSON.stringify(businessInfo ?? {})],
    );
    return result.rows[0];
  }

  async getCreator(userId: string) {
    const result = await this.pool.query(`SELECT * FROM creators WHERE user_id = $1::uuid`, [userId]);
    return result.rows[0];
  }
}

