import type { FastifyInstance } from 'fastify';
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  offboardSchema,
} from '@hr-portal/shared';
import { prisma } from '../lib/prisma.js';
import { logAudit } from '../lib/audit.js';
import { generateDocument } from '../services/pdf.js';

function parseDate(value: string) {
  return new Date(value.includes('T') ? value : `${value}T00:00:00.000Z`);
}

type EmployeeBody = Record<string, unknown>;

/** Normalises optional strings ('' -> null) and parses date-only fields. */
function buildEmployeeData(body: EmployeeBody) {
  const data: Record<string, unknown> = { ...body };
  const blank = (k: string) => {
    if (data[k] === '' || data[k] === undefined) delete data[k];
  };
  // Empty optional relations/strings should not overwrite with ''
  for (const k of [
    'phone',
    'gender',
    'address',
    'emergencyContactName',
    'emergencyContactPhone',
    'employmentType',
    'workLocation',
    'pan',
    'bankName',
    'bankAccount',
    'ifsc',
  ]) {
    if (data[k] === '') data[k] = null;
  }
  if (data.managerId === '' || data.managerId === undefined) {
    delete data.managerId;
  }
  if ('joinDate' in data && data.joinDate) {
    data.joinDate = parseDate(data.joinDate as string);
  }
  if ('dateOfBirth' in data) {
    data.dateOfBirth = data.dateOfBirth
      ? parseDate(data.dateOfBirth as string)
      : null;
  }
  if ('lastWorkingDay' in data) {
    data.lastWorkingDay = data.lastWorkingDay
      ? parseDate(data.lastWorkingDay as string)
      : null;
  }
  blank('managerId');
  return data;
}

export async function employeeRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/employees/stats', async () => {
    const [total, onboarding, active, offboarding, terminated] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'onboarding' } }),
      prisma.employee.count({ where: { status: 'active' } }),
      prisma.employee.count({ where: { status: 'offboarding' } }),
      prisma.employee.count({ where: { status: 'terminated' } }),
    ]);
    return { total, onboarding, active, offboarding, terminated };
  });

  app.get('/employees', async (request) => {
    const { search, status } = request.query as { search?: string; status?: string };
    const employees = await prisma.employee.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { department: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return employees;
  });

  app.get('/employees/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { generatedAt: 'desc' } },
        payslips: { orderBy: { periodEnd: 'desc' }, take: 12 },
        manager: { select: { id: true, firstName: true, lastName: true } },
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
          include: { leaveType: true },
        },
      },
    });
    if (!employee) return reply.status(404).send({ error: 'Employee not found' });
    return employee;
  });

  app.post('/employees', async (request, reply) => {
    const body = employeeCreateSchema.parse(request.body);
    const user = request.user as { sub: string };

    const existing = await prisma.employee.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return reply
        .status(409)
        .send({ error: `An employee with email ${body.email} already exists.` });
    }

    const employee = await prisma.employee.create({
      data: buildEmployeeData(body) as never,
    });
    await logAudit('employee_created', {
      userId: user.sub,
      employeeId: employee.id,
      details: employee.email,
    });

    if (body.status === 'onboarding') {
      await generateDocument(employee.id, 'offer_letter', {}, user.sub);
      await generateDocument(employee.id, 'onboarding_pack', {}, user.sub);
    }

    return prisma.employee.findUniqueOrThrow({
      where: { id: employee.id },
      include: { documents: true },
    });
  });

  app.patch('/employees/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = employeeUpdateSchema.parse(request.body);
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Employee not found' });

    const employee = await prisma.employee.update({
      where: { id },
      data: buildEmployeeData(body) as never,
    });
    return employee;
  });

  app.delete('/employees/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send({ error: 'Employee not found' });
    await prisma.employee.delete({ where: { id } });
    return { success: true };
  });

  app.post('/employees/:id/onboard', async (request) => {
    const { id } = request.params as { id: string };
    const user = request.user as { sub: string };
    await prisma.employee.update({
      where: { id },
      data: { status: 'onboarding' },
    });
    const docs = [
      await generateDocument(id, 'offer_letter', {}, user.sub),
      await generateDocument(id, 'onboarding_pack', {}, user.sub),
    ];
    return { documents: docs };
  });

  app.post('/employees/:id/offboard', async (request) => {
    const { id } = request.params as { id: string };
    const body = offboardSchema.parse(request.body);
    const user = request.user as { sub: string };
    await prisma.employee.update({
      where: { id },
      data: {
        status: 'offboarding',
        lastWorkingDay: parseDate(body.lastWorkingDay),
      },
    });
    const docs = [
      await generateDocument(id, 'experience_letter', {}, user.sub),
      await generateDocument(id, 'relieving_letter', {}, user.sub),
    ];
    return { documents: docs };
  });
}
