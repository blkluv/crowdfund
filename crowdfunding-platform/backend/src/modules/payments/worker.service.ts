import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class PaymentsWorkerService {
  private logger = new Logger(PaymentsWorkerService.name);

  constructor(
    @Inject('DATABASE_POOL') private pool: any,
    private readonly realtime: RealtimeService,
  ) {}

  async processStripeEvent(event: Stripe.Event) {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await this.markPledgePaid(intent.id, intent.latest_charge?.toString());
      return;
    }

    if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await this.markPledgeFailed(intent.id);
      return;
    }

    this.logger.debug(`Unhandled stripe event: ${event.type}`);
  }

  private async markPledgePaid(paymentIntentId: string, chargeId?: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const pledgeRes = await client.query(
        `SELECT * FROM pledges WHERE payment_intent_id = $1 LIMIT 1 FOR UPDATE`,
        [paymentIntentId],
      );
      const pledge = pledgeRes.rows[0];
      if (!pledge) {
        await client.query('COMMIT');
        return;
      }
      if (pledge.status === 'paid') {
        await client.query('COMMIT');
        return;
      }

      await client.query(
        `UPDATE pledges SET status = 'paid', transaction_id = COALESCE(transaction_id, $2), updated_at = NOW()
         WHERE id = $1::uuid`,
        [pledge.id, chargeId ?? null],
      );

      await client.query(
        `INSERT INTO payments (pledge_id, provider, intent_id, charge_id, status, amount, currency)
         VALUES ($1::uuid, 'stripe', $2, $3, 'succeeded', $4, $5)`,
        [pledge.id, paymentIntentId, chargeId ?? null, pledge.total_amount, pledge.currency],
      );

      const priorPaid = await client.query(
        `SELECT 1
         FROM pledges
         WHERE project_id = $1::uuid AND user_id = $2::uuid AND status = 'paid' AND id <> $3::uuid
         LIMIT 1`,
        [pledge.project_id, pledge.user_id, pledge.id],
      );
      const isNewBacker = priorPaid.rows.length === 0;

      const projUpdate = await client.query(
        `UPDATE projects
         SET current_amount = current_amount + $2,
             backers_count = backers_count + $3
         WHERE id = $1::uuid
         RETURNING current_amount, backers_count`,
        [pledge.project_id, pledge.total_amount, isNewBacker ? 1 : 0],
      );

      await client.query('COMMIT');

      const updated = projUpdate.rows[0];
      if (updated) {
        this.realtime.emit(pledge.project_id, {
          type: 'funding',
          project_id: pledge.project_id,
          current_amount: updated.current_amount,
          backers_count: Number(updated.backers_count ?? 0),
        });
      }
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  private async markPledgeFailed(paymentIntentId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const pledgeRes = await client.query(
        `SELECT * FROM pledges WHERE payment_intent_id = $1 LIMIT 1 FOR UPDATE`,
        [paymentIntentId],
      );
      const pledge = pledgeRes.rows[0];
      if (!pledge) {
        await client.query('COMMIT');
        return;
      }
      if (pledge.status !== 'pending') {
        await client.query('COMMIT');
        return;
      }

      // Release reserved inventory if any
      const itemsRes = await client.query(`SELECT * FROM pledge_items WHERE pledge_id = $1::uuid`, [pledge.id]);
      for (const item of itemsRes.rows) {
        if (item.reward_tier_id) {
          await client.query(
            `UPDATE reward_tiers SET quantity_sold = GREATEST(quantity_sold - $2, 0) WHERE id = $1::uuid`,
            [item.reward_tier_id, item.quantity ?? 1],
          );
        }
        if (item.add_on_id) {
          await client.query(
            `UPDATE add_ons SET quantity_sold = GREATEST(quantity_sold - $2, 0) WHERE id = $1::uuid`,
            [item.add_on_id, item.quantity ?? 1],
          );
        }
      }

      await client.query(`UPDATE pledges SET status = 'failed', updated_at = NOW() WHERE id = $1::uuid`, [pledge.id]);

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

