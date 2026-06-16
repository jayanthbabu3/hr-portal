import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/dashboard', async () => {
    const now = new Date();
    const [stats, recentDocuments, recentAudit, upcomingHolidays, pendingLeaves] =
      await Promise.all([
        Promise.all([
          prisma.employee.count(),
          prisma.employee.count({ where: { status: 'onboarding' } }),
          prisma.employee.count({ where: { status: 'offboarding' } }),
          prisma.document.count({ where: { sentAt: null } }),
          prisma.leaveRequest.count({ where: { status: 'pending' } }),
          prisma.employee.count({ where: { status: 'active' } }),
        ]),
        prisma.document.findMany({
          take: 8,
          orderBy: { generatedAt: 'desc' },
          include: {
            employee: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        }),
        prisma.holiday.findMany({
          where: { date: { gte: now } },
          orderBy: { date: 'asc' },
          take: 5,
        }),
        prisma.leaveRequest.findMany({
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: {
            employee: { select: { firstName: true, lastName: true } },
            leaveType: { select: { name: true } },
          },
        }),
      ]);

    return {
      stats: {
        totalEmployees: stats[0],
        onboarding: stats[1],
        offboarding: stats[2],
        pendingSends: stats[3],
        pendingLeaves: stats[4],
        active: stats[5],
      },
      recentDocuments,
      recentAudit,
      upcomingHolidays,
      pendingLeaves,
    };
  });
}
