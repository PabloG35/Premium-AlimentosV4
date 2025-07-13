// api/src/instrument.ts
import * as Sentry from "@sentry/nestjs";

Sentry.init({
  // Usa la variable de entorno que ya configuramos
  dsn: process.env.SENTRY_DSN,

  // Ajusta esto en producción a un valor más bajo (ej. 0.1)
  tracesSampleRate: 1.0,
});