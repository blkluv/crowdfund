import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PaymentsWorkerService } from './worker.service';

@Module({
  imports: [RealtimeModule],
  controllers: [StripeWebhookController],
  providers: [StripeService, PaymentsWorkerService],
  exports: [StripeService],
})
export class PaymentsModule {}

