// src/modules/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JudgeMeClient } from 'src/clients/judgeme.client';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [HttpModule],
  providers: [JudgeMeClient, ReviewsService],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
