import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendVerificationEmail(email: string, token: string) {
    // Mailhog stub
    console.log(`Verification email sent to ${email} with token ${token}`);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    console.log(`Password reset email sent to ${email} with token ${token}`);
  }
}

