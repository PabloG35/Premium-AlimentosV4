import { DynamicModule } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PrismaService } from '../prisma.service';

export class AdminModule {
  static async register(): Promise<DynamicModule> {
    const { AdminModule: NestAdmin } = await import('@adminjs/nestjs'); // ESM
    const AdminJS = (await import('adminjs')).default;
    const { Database, Resource, getModelByName } = await import(
      '@adminjs/prisma'
    );

    AdminJS.registerAdapter({ Database, Resource });

    return NestAdmin.createAdminAsync({
      imports: [PrismaModule],
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({
        adminJsOptions: {
          rootPath: '/admin',
          resources: [
            { resource: { model: getModelByName('User'), client: prisma } },
          ],
          branding: { companyName: 'Mi Tienda' },
        },
        helmet: false,
      }),
    });
  }
}
