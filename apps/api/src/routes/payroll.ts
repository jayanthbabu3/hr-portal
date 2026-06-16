import type { FastifyInstance } from 'fastify';
import { payslipGenerateSchema } from '@hr-portal/shared';
import { prisma } from '../lib/prisma.js';
import {
  generateDocument,
  formatEmployeeContext,
} from '../services/pdf.js';
import { getCompanyInfo } from '../services/company.js';
import { rupeesInWords } from '../lib/numberToWords.js';

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatMoney(amount: number, currency: string) {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

export async function payrollRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/payroll/payslips', async (request) => {
    const { employeeId } = request.query as { employeeId?: string };
    return prisma.payslip.findMany({
      where: employeeId ? { employeeId } : {},
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        document: true,
      },
      orderBy: { periodEnd: 'desc' },
    });
  });

  app.post('/payroll/payslips', async (request) => {
    const body = payslipGenerateSchema.parse(request.body);
    const user = request.user as { sub: string };
    const periodStart = parseDate(body.periodStart);
    const periodEnd = parseDate(body.periodEnd);

    const employees = body.employeeId
      ? [await prisma.employee.findUniqueOrThrow({ where: { id: body.employeeId } })]
      : await prisma.employee.findMany({
          where: { status: { in: ['active', 'onboarding'] } },
        });

    const company = await getCompanyInfo();
    const results = [];

    for (const employee of employees) {
      const earnings = body.earnings ?? employee.salary / 12;
      const deductions = body.deductions ?? earnings * 0.15;
      const netPay = earnings - deductions;

      const payslip = await prisma.payslip.create({
        data: {
          employeeId: employee.id,
          periodStart,
          periodEnd,
          earnings,
          deductions,
          netPay,
        },
      });

      const baseContext = formatEmployeeContext(employee, company);
      const fmt = (n: number) => formatMoney(n, employee.currency);

      const basic = Math.round(earnings * 0.5);
      const hra = Math.round(earnings * 0.2);
      const special = earnings - basic - hra;
      const earningLines = [
        { label: 'Basic Salary', amount: fmt(basic) },
        { label: 'House Rent Allowance', amount: fmt(hra) },
        { label: 'Special Allowance', amount: fmt(special) },
      ];

      const pf = Math.round(basic * 0.12);
      const professionalTax = Math.min(200, Math.max(0, Math.round(deductions)));
      const tds = Math.max(0, Math.round(deductions) - pf - professionalTax);
      const deductionLines = [
        { label: 'Provident Fund (PF)', amount: fmt(pf) },
        { label: 'Professional Tax', amount: fmt(professionalTax) },
        { label: 'Tax Deducted at Source (TDS)', amount: fmt(tds) },
      ];

      const payPeriodLabel = periodEnd.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });

      const doc = await generateDocument(employee.id, 'payslip', {
        ...baseContext,
        employeeId: employee.id,
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        payPeriodLabel,
        earnings,
        deductions,
        netPay,
        earningLines,
        deductionLines,
        grossFormatted: fmt(earnings),
        earningsFormatted: fmt(earnings),
        deductionsFormatted: fmt(deductions),
        netPayFormatted: fmt(netPay),
        netPayWords: rupeesInWords(netPay),
      }, user.sub);

      await prisma.payslip.update({
        where: { id: payslip.id },
        data: { documentId: doc.id },
      });

      results.push(
        await prisma.payslip.findUniqueOrThrow({
          where: { id: payslip.id },
          include: { document: true, employee: true },
        }),
      );
    }

    return { payslips: results };
  });
}
