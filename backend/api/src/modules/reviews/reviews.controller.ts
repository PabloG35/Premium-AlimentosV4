// src/modules/reviews/reviews.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewResponseDto } from './dto/review-response.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  /** 🔓 Público */
  @Get('products/:id/reviews')
  findByProduct(@Param('id') id: string): Promise<ReviewResponseDto[]> {
    return this.svc.findByProduct(id);
  }

  /** 🔒 Admin */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.T_I)
  @Get('reviews')
  findAll(@Query('page') page = 1, @Query('perPage') perPage = 20) {
    return this.svc.findAll(page, perPage);
  }
}
