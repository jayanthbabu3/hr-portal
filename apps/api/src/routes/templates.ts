import type { FastifyInstance } from 'fastify';
import { templateTypeSchema, templateUpdateSchema } from '@hr-portal/shared';
import { prisma } from '../lib/prisma.js';
import { getTemplateHtml } from '../services/pdf.js';

export async function templateRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/templates', async () => {
    return prisma.template.findMany({ orderBy: { type: 'asc' } });
  });

  app.get('/templates/:type', async (request) => {
    const { type } = request.params as { type: string };
    templateTypeSchema.parse(type);
    const template = await prisma.template.findUnique({
      where: { type: type as never },
    });
    if (template) return template;
    const htmlBody = await getTemplateHtml(type as never);
    return { type, htmlBody, subject: null, id: '', updatedAt: new Date() };
  });

  app.patch('/templates/:type', async (request) => {
    const { type } = request.params as { type: string };
    templateTypeSchema.parse(type);
    const body = templateUpdateSchema.parse(request.body);
    return prisma.template.upsert({
      where: { type: type as never },
      create: { type: type as never, htmlBody: body.htmlBody, subject: body.subject },
      update: { htmlBody: body.htmlBody, subject: body.subject },
    });
  });
}
