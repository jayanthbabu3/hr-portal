import type { FastifyInstance } from 'fastify';
import { companySettingsSchema, emailSettingsSchema } from '@hr-portal/shared';
import { prisma } from '../lib/prisma.js';
import { testSmtpConnection } from '../services/email.js';
import { env } from '../lib/config.js';

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/settings/company', async () => {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });
    return (
      settings ?? {
        id: 'default',
        name: env.company.name,
        address: env.company.address,
        logoUrl: env.company.logoUrl,
        signatoryName: env.company.signatoryName,
        signatoryTitle: env.company.signatoryTitle,
      }
    );
  });

  app.patch('/settings/company', async (request) => {
    const body = companySettingsSchema.parse(request.body);
    return prisma.companySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...body, logoUrl: body.logoUrl || null },
      update: { ...body, logoUrl: body.logoUrl || null },
    });
  });

  app.get('/settings/email', async () => {
    const settings = await prisma.emailSettings.findUnique({
      where: { id: 'default' },
    });
    return (
      settings ?? {
        id: 'default',
        smtpHost: env.smtp.host,
        smtpPort: env.smtp.port,
        smtpUser: env.smtp.user,
        smtpPass: '',
        fromEmail: env.smtp.fromEmail,
        fromName: env.smtp.fromName,
      }
    );
  });

  app.patch('/settings/email', async (request) => {
    const body = emailSettingsSchema.parse(request.body);
    return prisma.emailSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...body },
      update: body,
    });
  });

  app.post('/settings/email/test', async (_request, reply) => {
    try {
      await testSmtpConnection();
      return { success: true, message: 'SMTP connection verified' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMTP test failed';
      return reply.status(400).send({ success: false, message });
    }
  });
}
