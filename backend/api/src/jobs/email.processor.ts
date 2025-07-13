import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('email-queue') // Importante: el nombre de la cola que procesará
export class EmailProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`(JOB) Procesando tarea de la cola 'email-queue': ${job.id}`);
    console.log('(JOB) Datos de la tarea:', job.data);
    // Aquí iría la lógica real para enviar un email con Brevo
    return { status: 'ok' };
  }
}