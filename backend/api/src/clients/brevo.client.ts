import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface BrevoEmailPayload {
  to: { email: string; name: string }[];
  sender: { email: string; name: string };
  subject: string;
  htmlContent: string;
}

export interface BrevoTemplatePayload<P = Record<string, any>> {
  to: { email: string; name: string }[];
  templateId: number;
  params: P;
  sender?: { email: string; name: string };
}

@Injectable()
export class BrevoClient {
  private readonly apiKey = process.env.BREVO_API_KEY!;
  private readonly logger = new Logger(BrevoClient.name);
  private readonly url = 'https://api.brevo.com/v3/smtp/email';

  constructor(private readonly http: HttpService) {}

  async sendEmail(payload: BrevoEmailPayload): Promise<void> {
    await this.post({
      to: payload.to,
      sender: payload.sender,
      subject: payload.subject,
      htmlContent: payload.htmlContent,
    });
  }

  async sendTemplateEmail<P>(payload: BrevoTemplatePayload<P>): Promise<void> {
    await this.post({
      to: payload.to,
      templateId: payload.templateId,
      params: payload.params,
      ...(payload.sender && { sender: payload.sender }),
    });
  }

  private async post(body: unknown): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(this.url, body, {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }),
      );
    } catch (err: any) {
      this.logger.error(
        'Brevo request failed',
        err?.response?.data ?? err.message ?? err,
      );
      throw err;
    }
  }
}
