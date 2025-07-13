import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Importamos nuestro Enum desde Prisma

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);