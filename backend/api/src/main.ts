import './instrument';
import { NestFactory } from '@nestjs/core';
import { Module, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';
import express from 'express';

import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AdminModule } from './admin/admin.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  /* 1️⃣  Certificados locales ------------------------------------------- */
  const httpsOptions = {
    key: fs.readFileSync('localhost+2-key.pem'),
    cert: fs.readFileSync('localhost+2.pem'),
  };

  /* 2️⃣  AdminJS dynamic module ----------------------------------------- */
  const adminDynamicModule = await AdminModule.register();

  /* 3️⃣  Root module (App + Admin) -------------------------------------- */
  @Module({ imports: [AppModule, adminDynamicModule] })
  class RootModule {}

  /* 4️⃣  Create app ------------------------------------------------------ */
  const app = await NestFactory.create(RootModule, {
    httpsOptions,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  /* 5️⃣  Seguridad ------------------------------------------------------- */
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/admin')) return next();
    return helmet()(req, res, next);
  });
  app.use('/admin', helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  /* 6️⃣  Parsers globales ------------------------------------------------ */
  const webhookPath = process.env.MP_WEBHOOK_PATH || '/webhooks/mercadopago';

  // Saltamos JSON / urlencoded si el path coincide (query ignorada)
  app.use((req, res, next) => {
    if (req.path === webhookPath) return next();
    json()(req, res, next);
  });
  app.use((req, res, next) => {
    if (req.path === webhookPath) return next();
    urlencoded({ extended: true })(req, res, next);
  });

  /* 7️⃣  Raw body SOLO para el webhook ---------------------------------- */
  app.use(webhookPath, express.raw({ type: 'application/json', limit: '1mb' }));

  /* 8️⃣  Validación + CORS ---------------------------------------------- */
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  /* 9️⃣  Swagger --------------------------------------------------------- */
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('Documentación de la API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  /* 🔟  Arranque -------------------------------------------------------- */
  await app.listen(3000);
  console.log('🚀  HTTPS en  https://localhost:3000');
}

bootstrap();
