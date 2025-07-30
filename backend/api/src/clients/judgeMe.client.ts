// src/clients/judgeme.client.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface JudgeMeReviewsResponse {
  reviews: Array<{
    id: number;
    rating: number;
    title: string;
    body: string;
    author?: string;
    created_at: string;
  }>;
}

@Injectable()
export class JudgeMeClient {
  private readonly apiKey = process.env.JUDGEME_API_KEY!;
  private readonly baseUrl = 'https://api.judge.me/v1';

  constructor(private readonly http: HttpService) {}

  /** Trae las reviews públicas de un producto */
  async getReviewsByProduct(
    productId: string,
  ): Promise<JudgeMeReviewsResponse['reviews']> {
    const url = `${this.baseUrl}/products/${productId}/reviews`;
    const response = await firstValueFrom(
      this.http.get<JudgeMeReviewsResponse>(url, {
        params: { app_key: this.apiKey },
      }),
    );
    return response.data.reviews;
  }

  /** Invita a review tras compra */
  async sendReviewInvite(orderId: string, email: string): Promise<boolean> {
    const url = `${this.baseUrl}/orders/${orderId}/trigger_invite`;
    const response = await firstValueFrom(
      this.http.post<{ success: boolean }>(url, {
        email,
        app_key: this.apiKey,
      }),
    );
    return response.data.success;
  }
}
