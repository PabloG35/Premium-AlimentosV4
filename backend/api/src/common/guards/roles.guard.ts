import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtiene los roles requeridos que pusimos en la etiqueta @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si una ruta no tiene la etiqueta @Roles, la dejamos pasar
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = {
      id: 'cuid-de-prueba',
      email: 'test@example.com',
      role: Role.T_I, // <--- CAMBIA ESTE VALOR PARA PROBAR (CLI, T_I, T_II)
    };
    request.user = user;
    // --- FIN DEL USUARIO DE PRUEBA ---

    // 2. Compara el rol del usuario con los roles requeridos
    return requiredRoles.some((role) => user.role === role);
  }
}