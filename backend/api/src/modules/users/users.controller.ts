// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── CLI ONLY ───────────────────────────

  /** GET /users/me → solo CLI */
  @Roles(Role.CLI)
  @Get('me')
  getProfile(@Req() req: Request) {
    const userId = (req as any).user.id as string;
    return this.usersService.findOne(userId);
  }

  /** PUT /users/me → solo CLI */
  @Roles(Role.CLI)
  @Put('me')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req as any).user.id as string;
    return this.usersService.update(userId, dto);
  }

  // ─── ADMIN CRUD (T_I ± T_II/T_III) ───────────────────────────

  /** POST /users → solo T_I */
  @Roles(Role.T_I)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** GET /users → T_I, T_II, T_III */
  @Roles(Role.T_I, Role.T_II, Role.T_III)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /** GET /users/:id → T_I, T_II, T_III */
  @Roles(Role.T_I, Role.T_II, Role.T_III)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /** PUT /users/:id → T_I, T_II */
  @Roles(Role.T_I, Role.T_II)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /** DELETE /users/:id → solo T_I */
  @Roles(Role.T_I)
  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
