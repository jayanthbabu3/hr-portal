import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './lib/config.js';
import { authRoutes } from './routes/auth.js';
import { employeeRoutes } from './routes/employees.js';
import { documentRoutes } from './routes/documents.js';
import { payrollRoutes } from './routes/payroll.js';
import { templateRoutes } from './routes/templates.js';
import { settingsRoutes } from './routes/settings.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { holidayRoutes } from './routes/holidays.js';
import { leaveRoutes } from './routes/leaves.js';
import { letterRoutes } from './routes/letters.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret: env.jwtSecret });

app.decorate(
  'authenticate',
  async (request: { jwtVerify: () => Promise<void> }, reply: { status: (code: number) => { send: (body: unknown) => unknown } }) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  },
);

await app.register(authRoutes);
await app.register(dashboardRoutes);
await app.register(employeeRoutes);
await app.register(documentRoutes);
await app.register(payrollRoutes);
await app.register(templateRoutes);
await app.register(settingsRoutes);
await app.register(holidayRoutes);
await app.register(leaveRoutes);
await app.register(letterRoutes);

app.get('/health', async () => ({ status: 'ok' }));

try {
  await app.listen({ port: env.port, host: '0.0.0.0' });
  console.log(`API running on http://localhost:${env.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
