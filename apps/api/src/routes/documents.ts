import fs from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { sendDocumentSchema } from '@hr-portal/shared';
import { prisma } from '../lib/prisma.js';
import { logAudit } from '../lib/audit.js';
import { sendEmailWithAttachment } from '../services/email.js';

export async function documentRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/documents', async (request) => {
    const { employeeId, type } = request.query as {
      employeeId?: string;
      type?: string;
    };
    return prisma.document.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(type ? { type: type as never } : {}),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });
  });

  app.get('/documents/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || !fs.existsSync(doc.filePath)) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    const buffer = fs.readFileSync(doc.filePath);
    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    return buffer;
  });

  app.post('/documents/:id/send', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = sendDocumentSchema.parse(request.body);
    const user = request.user as { sub: string };

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!doc || !fs.existsSync(doc.filePath)) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    const subject =
      body.subject ??
      `${doc.type.replace(/_/g, ' ')} — ${doc.employee.firstName} ${doc.employee.lastName}`;
    const html =
      body.body ??
      `<p>Dear ${doc.employee.firstName},</p><p>Please find your attached document from HR.</p><p>Regards,<br/>HR Team</p>`;

    await sendEmailWithAttachment({
      to: body.toEmail,
      subject,
      html,
      attachmentPath: doc.filePath,
      attachmentName: doc.fileName,
    });

    const updated = await prisma.document.update({
      where: { id },
      data: { sentAt: new Date(), sentTo: body.toEmail },
    });

    await logAudit('document_sent', {
      userId: user.sub,
      employeeId: doc.employeeId,
      details: `Sent ${doc.type} to ${body.toEmail}`,
    });

    return updated;
  });
}
