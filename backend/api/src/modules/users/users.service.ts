// src/modules/users/users.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crear usuario */
  async create(data: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) throw new BadRequestException('El correo ya está en uso');
    const hash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: { ...data, password: hash },
    });
    const { password, ...rest } = user;
    return rest;
  }

  /** Listar todos */
  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(({ password, ...u }) => u);
  }

  /** Obtener detalle */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { password, ...rest } = user;
    return rest;
  }

  /** Actualizar cualquier campo (sólo Tier I) */
  async update(id: string, data: UpdateUserDto) {
    // 1. Verificar que el usuario exista
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Construir el objeto con los campos a actualizar
    const updateData: Partial<{
      name: string;
      email: string;
      role: Role;
      password: string;
    }> = {};

    // Nombre
    if (data.name) {
      updateData.name = data.name;
    }

    // Email (con chequeo de unicidad)
    if (data.email && data.email !== user.email) {
      const exists = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (exists) {
        throw new BadRequestException('El correo ya está en uso');
      }
      updateData.email = data.email;
    }

    // Rol
    if (data.role) {
      updateData.role = data.role;
    }

    // Contraseña (hasheada)
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // 3. Ejecutar la actualización
    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // 4. Retornar sin la contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = updated;
    return rest;
  }

  /** Borrar usuario */
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.prisma.user.delete({ where: { id } });
    // Para DELETE 204, devolvemos vacío
  }
}
