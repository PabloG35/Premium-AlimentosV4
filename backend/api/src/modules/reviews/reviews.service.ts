// src/modules/reviews/reviews.service.ts
import { Injectable } from '@nestjs/common';
import { JudgeMeClient } from 'src/clients/judgeme.client';
import { ReviewResponseDto } from './dto/review-response.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly judgeMe: JudgeMeClient) {}

  async findByProduct(productId: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.judgeMe.getReviewsByProduct(productId);
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      authorName: r.author ?? 'Anónimo',
      createdAt: r.created_at,
    }));
  }

  // método placeholder para admin
  async findAll(
    page = 1,
    perPage = 20,
  ): Promise<{ data: ReviewResponseDto[]; total: number }> {
    return { data: [], total: 0 };
  }
}
