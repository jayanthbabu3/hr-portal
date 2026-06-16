import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const templatesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../templates',
);
import puppeteer from 'puppeteer';
import type { DocumentType, Employee } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/config.js';
import { getCompanyInfo } from './company.js';
import { logAudit } from '../lib/audit.js';

async function ensureStorageDir() {
  await fs.mkdir(env.storagePath, { recursive: true });
}

export function formatEmployeeContext(employee: Employee, company: Awaited<ReturnType<typeof getCompanyInfo>>) {
  const joinDate = employee.joinDate.toISOString().slice(0, 10);
  const lastWorkingDay = employee.lastWorkingDay?.toISOString().slice(0, 10) ?? '';
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const localeForCurrency = employee.currency === 'INR' ? 'en-IN' : 'en-US';
  const monthlySalary = employee.salary.toLocaleString(localeForCurrency, {
    style: 'currency',
    currency: employee.currency,
    maximumFractionDigits: 0,
  });
  const tenureYears = Math.max(
    0,
    Math.floor(
      (Date.now() - employee.joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    ),
  );

  return {
    fullName,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? '',
    department: employee.department,
    jobTitle: employee.jobTitle,
    joinDate,
    lastWorkingDay,
    salary: employee.salary,
    monthlySalary,
    currency: employee.currency,
    status: employee.status,
    tenureYears,
    companyName: company.name,
    companyAddress: company.address.replace(/\n/g, '<br/>'),
    companyAddressInline: company.address.replace(/\n/g, ', '),
    companyEmail: company.email,
    companyPhone: company.phone,
    companyWebsite: company.website,
    companyCin: company.cin,
    monogram: company.name.trim().charAt(0).toUpperCase(),
    place: company.address.split('\n').pop()?.split(',')[0]?.trim() ?? '',
    logoUrl: company.logoUrl,
    signatoryName: company.signatoryName,
    signatoryTitle: company.signatoryTitle,
    generatedDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
}

export async function getTemplateHtml(type: DocumentType): Promise<string> {
  const dbTemplate = await prisma.template.findUnique({ where: { type } });
  if (dbTemplate) return dbTemplate.htmlBody;

  return fs.readFile(path.join(templatesDir, `${type}.hbs`), 'utf-8');
}

let partialsRegistered = false;

async function registerPartials() {
  if (partialsRegistered) return;
  for (const name of ['base-styles', 'letterhead', 'footer']) {
    const source = await fs.readFile(
      path.join(templatesDir, `${name}.hbs`),
      'utf-8',
    );
    Handlebars.registerPartial(name, source);
  }
  partialsRegistered = true;
}

export async function renderHtml(
  type: DocumentType,
  context: Record<string, unknown>,
): Promise<string> {
  await registerPartials();
  const templateSource = await getTemplateHtml(type);
  const compiled = Handlebars.compile(templateSource);
  return compiled(context);
}

function resolveChromePath(): string | undefined {
  const fromEnv =
    process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (fromEnv && fsSync.existsSync(fromEnv)) return fromEnv;

  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  return candidates.find((p) => fsSync.existsSync(p));
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const executablePath = resolveChromePath();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(executablePath ? { executablePath } : {}),
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function generateDocument(
  employeeId: string,
  type: DocumentType,
  extraContext: Record<string, unknown> = {},
  userId?: string,
) {
  const employee = await prisma.employee.findUniqueOrThrow({
    where: { id: employeeId },
  });
  const company = await getCompanyInfo();
  const refCodes: Record<string, string> = {
    offer_letter: 'OFR',
    onboarding_pack: 'ONB',
    payslip: 'PAY',
    experience_letter: 'EXP',
    relieving_letter: 'REL',
    promotion_letter: 'PRM',
    increment_letter: 'INC',
    confirmation_letter: 'CNF',
    warning_letter: 'WRN',
    employment_verification: 'EMP',
    internship_certificate: 'INT',
    noc: 'NOC',
  };
  const refNo = `NEU/${refCodes[type] ?? 'DOC'}/${new Date().getFullYear()}/${employee.id
    .replace(/-/g, '')
    .slice(0, 6)
    .toUpperCase()}`;
  const context = {
    refNo,
    ...formatEmployeeContext(employee, company),
    ...extraContext,
  };

  const html = await renderHtml(type, context);
  const pdfBuffer = await htmlToPdf(html);

  await ensureStorageDir();
  const existingCount = await prisma.document.count({
    where: { employeeId, type },
  });
  const version = existingCount + 1;
  const fileName = `${type}_v${version}_${employee.lastName.toLowerCase()}.pdf`;
  const filePath = path.join(env.storagePath, fileName);
  await fs.writeFile(filePath, pdfBuffer);

  const document = await prisma.document.create({
    data: {
      employeeId,
      type,
      fileName,
      filePath,
      version,
    },
    include: { employee: true },
  });

  await logAudit('document_generated', {
    userId,
    employeeId,
    details: `${type} v${version}`,
  });

  return document;
}
