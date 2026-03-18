import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { PaymentsWorkerService } from './worker.service';

@ApiTags('Payments')
@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly worker: PaymentsWorkerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handle(@Req() req: Request, @Headers('stripe-signature') sig?: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const rawBody = (req as any).body as Buffer;

    if (!webhookSecret) throw new BadRequestException('STRIPE_WEBHOOK_SECRET not configured');
    if (!sig) throw new BadRequestException('Missing stripe-signature header');

    let event: Stripe.Event;
    try {
      event = this.stripeService.client.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (e: any) {
      throw new BadRequestException(`Invalid signature: ${e?.message ?? 'unknown error'}`);
    }

    await this.worker.processStripeEvent(event);
    return { received: true };
  }
}

