import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;

  // Usuarios
  // Admin (Tier I)
  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@demo.com',
      password: await bcrypt.hash('supersecret', saltRounds),
      role: Role.T_I,
    },
  });

  // Productos
  await prisma.product.upsert({
    where: { sku: 'SKU-001' },
    update: {},
    create: {
      sku: 'SKU-001',
      name: 'Producto Demo 1',
      price: 19.99,
      description: 'Un producto de prueba.',
      stock: 100,
    },
  });

  // Cupón
  await prisma.coupon.upsert({
    where: { code: 'DEMO10' },
    update: {},
    create: {
      code: 'DEMO10',
      discountPercent: 10,
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
