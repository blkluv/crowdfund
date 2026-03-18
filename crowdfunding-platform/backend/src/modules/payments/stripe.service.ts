import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secret) {
      // Keep service constructible for non-stripe deployments; endpoints will throw.
      this.stripe = null as unknown as Stripe;
      return;
    }
    this.stripe = new Stripe(secret, { apiVersion: '2024-06-20' });
  }

  get client() {
    if (!this.stripe) throw new BadRequestException('STRIPE_SECRET_KEY not configured');
    return this.stripe;
  }
}

