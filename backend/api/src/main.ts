import './instrument';
import { NestFactory } from '@nestjs/core';
import { Module, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';

import { AppModule } from './app.module';
import { AdminModule } from './admin/admin.module'; // 👈
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  /* 1.  Certificados locales */
  const httpsOptions = {
    key: fs.readFileSync('localhost+2-key.pem'),
    cert: fs.readFileSync('localhost+2.pem'),
  };

  /* 2.  Genera dinámicamente el módulo de AdminJS */
  const adminDynamicModule = await AdminModule.register();

  /* 3.  Define un módulo raíz que combine App + Admin */
  @Module({
    imports: [AppModule, adminDynamicModule],
  })
  class RootModule {}

  /* 4.  Crea la aplicación a partir de RootModule */
  const app = await NestFactory.create(RootModule, {
    httpsOptions,
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  /* 5.  Seguridad */
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/admin')) return next();
    return helmet()(req, res, next);
  });
  app.use('/admin', helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  /* 6.  Validación + CORS */
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  /* 7.  Swagger */
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

  /* 8.  ¡Arranque! */
  await app.listen(3000);
  console.log('🚀  HTTPS en  https://localhost:3000');
}

bootstrap();
