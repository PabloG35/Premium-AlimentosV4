// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private get jwtSecret() {
    return process.env.JWT_SECRET;
  }
  private get jwtExpiresIn() {
    return process.env.JWT_EXPIRATION || '1h';
  }
  private get refreshSecret() {
    return process.env.REFRESH_SECRET;
  }
  private get refreshExpiresIn() {
    return process.env.REFRESH_EXPIRATION || '7d';
  }

  /** Verifica credenciales (bcrypt) */
  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) return null;

    const { password, ...rest } = user;
    return rest;
  }

  /** Genera ambos tokens */
  private getTokens(payload: { sub: string; email: string; role: Role }) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });
    return { accessToken, refreshToken };
  }

  /** Login: devuelve access & refresh */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    return this.getTokens({ sub: user.id, email: user.email, role: user.role });
  }

  /** Registro: crea CLI + tokens */
  async register(name: string, email: string, pass: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('El correo ya está en uso');
    const hash = await bcrypt.hash(pass, 10);
    const user = await this.prisma.user.create({
      data: { name, email, password: hash, role: Role.CLI },
    });
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.getTokens(payload);
  }

  /** Refresh: verifica refreshToken y devuelve nuevo accessToken */
  async refresh(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.refreshSecret,
      });
      const { sub, email, role } = payload as {
        sub: string;
        email: string;
        role: Role;
      };
      const accessToken = this.jwtService.sign(
        { sub, email, role },
        { secret: this.jwtSecret, expiresIn: this.jwtExpiresIn },
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  /** Logout: aquí solo devolvemos ok; cliente debe descartar tokens */
  async logout() {
    return { message: 'Logged out' };
  }
}
