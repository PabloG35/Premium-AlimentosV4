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

  // Gerente (Tier II)
  await prisma.user.upsert({
    where: { email: 'gerente@demo.com' },
    update: {},
    create: {
      name: 'Gerente Demo',
      email: 'gerente@demo.com',
      password: await bcrypt.hash('gerentesecret', saltRounds),
      role: Role.T_II,
    },
  });
  
  // Staff (Tier III)
  await prisma.user.upsert({
    where: { email: 'staff@demo.com' },
    update: {},
    create: {
      name: 'Staff Demo',
      email: 'staff@demo.com',
      password: await bcrypt.hash('staffsecret', saltRounds),
      role: Role.T_III,
    },
  });

  // Cliente (CLI)
  await prisma.user.upsert({
    where: { email: 'cliente@demo.com' },
    update: {},
    create: {
      name: 'Cliente Demo',
      email: 'cliente@demo.com',
      password: await bcrypt.hash('clientesecret', saltRounds),
      role: Role.CLI,
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
