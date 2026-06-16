import type { FastifyInstance } from 'fastify';
import {
  leaveTypeSchema,
  leaveRequestSchema,
  leaveReviewSchema,
} from '@hr-portal/shared';
import { prisma } from '../lib/prisma.js';
import { logAudit } from '../lib/audit.js';

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Counts working days (Mon–Fri) between two dates inclusive, excluding holidays. */
function workingDays(start: Date, end: Date, holidays: Set<string>): number {
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    const iso = cursor.toISOString().slice(0, 10);
    if (day !== 0 && day !== 6 && !holidays.has(iso)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export async function leaveRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // ---------- Leave types ----------
  app.get('/leave-types', async () => {
    return prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
  });

  app.post('/leave-types', async (request, reply) => {
    const body = leaveTypeSchema.parse(request.body);
    const existing = await prisma.leaveType.findUnique({
      where: { code: body.code },
    });
    if (existing) {
      return reply
        .status(409)
        .send({ error: `Leave type code "${body.code}" already exists.` });
    }
    return prisma.leaveType.create({
      data: { ...body, color: body.color || null },
    });
  });

  app.delete('/leave-types/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const inUse = await prisma.leaveRequest.count({ where: { leaveTypeId: id } });
    if (inUse > 0) {
      return reply
        .status(409)
        .send({ error: 'Cannot delete a leave type that is in use.' });
    }
    await prisma.leaveType.delete({ where: { id } });
    return { success: true };
  });

  // ---------- Leave requests ----------
  app.get('/leaves', async (request) => {
    const { employeeId, status } = request.query as {
      employeeId?: string;
      status?: string;
    };
    return prisma.leaveRequest.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, department: true },
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.post('/leaves', async (request, reply) => {
    const body = leaveRequestSchema.parse(request.body);
    const user = request.user as { sub: string };
    const start = parseDate(body.startDate);
    const end = parseDate(body.endDate);
    if (end < start) {
      return reply
        .status(400)
        .send({ error: 'End date cannot be before start date.' });
    }

    const holidayRows = await prisma.holiday.findMany({
      where: { date: { gte: start, lte: end } },
    });
    const holidays = new Set(
      holidayRows.map((h) => h.date.toISOString().slice(0, 10)),
    );
    const days = workingDays(start, end, holidays);
    if (days <= 0) {
      return reply.status(400).send({
        error: 'The selected range has no working days (weekends/holidays only).',
      });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: body.employeeId,
        leaveTypeId: body.leaveTypeId,
        startDate: start,
        endDate: end,
        days,
        reason: body.reason || null,
      },
      include: { employee: true, leaveType: true },
    });

    await logAudit('leave_requested', {
      userId: user.sub,
      employeeId: body.employeeId,
      details: `${days} day(s) ${leave.leaveType.name}`,
    });

    return leave;
  });

  app.post('/leaves/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = leaveReviewSchema.parse(request.body);
    const user = request.user as { sub: string };

    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Leave not found' });

    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: body.status,
        reviewNote: body.reviewNote || null,
        reviewedBy: user.sub,
        reviewedAt: new Date(),
      },
      include: { employee: true, leaveType: true },
    });

    await logAudit(`leave_${body.status}`, {
      userId: user.sub,
      employeeId: leave.employeeId,
      details: `${leave.days} day(s) ${leave.leaveType.name}`,
    });

    return leave;
  });

  // ---------- Balances ----------
  app.get('/leaves/balances', async (request) => {
    const { employeeId, year } = request.query as {
      employeeId?: string;
      year?: string;
    };
    const y = Number(year) || new Date().getFullYear();
    const yearStart = parseDate(`${y}-01-01`);
    const yearEnd = parseDate(`${y}-12-31`);

    const types = await prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
    const requests = await prisma.leaveRequest.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        startDate: { gte: yearStart, lte: yearEnd },
      },
    });

    return types.map((t) => {
      const forType = requests.filter((r) => r.leaveTypeId === t.id);
      const used = forType
        .filter((r) => r.status === 'approved')
        .reduce((sum, r) => sum + r.days, 0);
      const pending = forType
        .filter((r) => r.status === 'pending')
        .reduce((sum, r) => sum + r.days, 0);
      return {
        leaveTypeId: t.id,
        name: t.name,
        code: t.code,
        color: t.color,
        paid: t.paid,
        allocated: t.annualQuota,
        used,
        pending,
        available: Math.max(0, t.annualQuota - used),
      };
    });
  });
}
