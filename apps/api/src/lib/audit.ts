import { prisma } from './prisma.js';

export async function logAudit(
  action: string,
  opts?: { userId?: string; employeeId?: string; details?: string },
) {
  await prisma.auditLog.create({
    data: {
      action,
      userId: opts?.userId,
      employeeId: opts?.employeeId,
      details: opts?.details,
    },
  });
}
