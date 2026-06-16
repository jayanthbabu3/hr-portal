import type { FastifyInstance } from 'fastify';
import { issueLetterSchema } from '@hr-portal/shared';
import { prisma } from '../lib/prisma.js';
import { generateDocument } from '../services/pdf.js';

function formatMoney(amount: number, currency: string) {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function letterRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.post('/employees/:id/letters', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = issueLetterSchema.parse(request.body);
    const user = request.user as { sub: string };

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return reply.status(404).send({ error: 'Employee not found' });

    const extraContext: Record<string, unknown> = {
      effectiveDate: formatDate(body.effectiveDate || undefined),
      newJobTitle: body.newJobTitle || '',
      newDepartment: body.newDepartment || '',
      reason: body.reason || '',
      purpose: body.purpose || '',
    };
    if (body.newSalary) {
      extraContext.newSalary = body.newSalary;
      extraContext.newSalaryFormatted = formatMoney(
        body.newSalary,
        employee.currency,
      );
    }

    const doc = await generateDocument(id, body.type, extraContext, user.sub);
    return doc;
  });
}
