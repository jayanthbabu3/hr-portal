import type { FastifyInstance } from 'fastify';
import { holidaySchema } from '@hr-portal/shared';
import { prisma } from '../lib/prisma.js';

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function holidayRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/holidays', async (request) => {
    const { year } = request.query as { year?: string };
    const where = year
      ? {
          date: {
            gte: parseDate(`${year}-01-01`),
            lte: parseDate(`${year}-12-31`),
          },
        }
      : {};
    return prisma.holiday.findMany({ where, orderBy: { date: 'asc' } });
  });

  app.post('/holidays', async (request) => {
    const body = holidaySchema.parse(request.body);
    return prisma.holiday.create({
      data: {
        name: body.name,
        date: parseDate(body.date),
        type: body.type,
        description: body.description || null,
      },
    });
  });

  app.patch('/holidays/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = holidaySchema.partial().parse(request.body);
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Holiday not found' });
    return prisma.holiday.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.date ? { date: parseDate(body.date) } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.description !== undefined
          ? { description: body.description || null }
          : {}),
      },
    });
  });

  app.delete('/holidays/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Holiday not found' });
    await prisma.holiday.delete({ where: { id } });
    return { success: true };
  });
}
