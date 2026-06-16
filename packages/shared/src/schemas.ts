import { z } from 'zod';
import {
  DOCUMENT_TYPES,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  GENDERS,
  HOLIDAY_TYPES,
  LETTER_TYPES,
  TEMPLATE_TYPES,
} from './constants.js';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalString = z.string().optional().or(z.literal(''));

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const employeeCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: optionalString,
  department: z.string().min(1),
  jobTitle: z.string().min(1),
  joinDate: z.string().datetime().or(dateOnly),
  salary: z.number().positive(),
  currency: z.string().default('INR'),
  status: z.enum(EMPLOYEE_STATUSES).default('onboarding'),
  lastWorkingDay: z.string().optional(),
  dateOfBirth: dateOnly.optional().or(z.literal('')),
  gender: z.enum(GENDERS).optional().or(z.literal('')),
  address: optionalString,
  emergencyContactName: optionalString,
  emergencyContactPhone: optionalString,
  employmentType: z.enum(EMPLOYMENT_TYPES).optional().or(z.literal('')),
  workLocation: optionalString,
  pan: optionalString,
  bankName: optionalString,
  bankAccount: optionalString,
  ifsc: optionalString,
  managerId: optionalString,
});

export const employeeUpdateSchema = employeeCreateSchema.partial();

export const holidaySchema = z.object({
  name: z.string().min(1),
  date: dateOnly,
  type: z.enum(HOLIDAY_TYPES).default('public'),
  description: optionalString,
});

export const leaveTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  annualQuota: z.number().nonnegative().default(0),
  paid: z.boolean().default(true),
  color: optionalString,
});

export const leaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  startDate: dateOnly,
  endDate: dateOnly,
  reason: optionalString,
});

export const leaveReviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
  reviewNote: optionalString,
});

export const issueLetterSchema = z.object({
  type: z.enum(LETTER_TYPES),
  effectiveDate: dateOnly.optional().or(z.literal('')),
  newJobTitle: optionalString,
  newDepartment: optionalString,
  newSalary: z.number().positive().optional(),
  reason: optionalString,
  purpose: optionalString,
});

export const offboardSchema = z.object({
  lastWorkingDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const payslipGenerateSchema = z.object({
  employeeId: z.string().uuid().optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  earnings: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
});

export const sendDocumentSchema = z.object({
  toEmail: z.string().email(),
  subject: z.string().optional(),
  body: z.string().optional(),
});

export const companySettingsSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  logoUrl: z.string().url().optional().or(z.literal('')),
  signatoryName: z.string().min(1),
  signatoryTitle: z.string().min(1),
});

export const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1),
  smtpPort: z.number().int().positive(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
});

export const templateUpdateSchema = z.object({
  htmlBody: z.string().min(1),
  subject: z.string().optional(),
});

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export const templateTypeSchema = z.enum(TEMPLATE_TYPES);

export type LoginInput = z.infer<typeof loginSchema>;
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
export type PayslipGenerateInput = z.infer<typeof payslipGenerateSchema>;
export type SendDocumentInput = z.infer<typeof sendDocumentSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;
export type HolidayInput = z.infer<typeof holidaySchema>;
export type LeaveTypeInput = z.infer<typeof leaveTypeSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type LeaveReviewInput = z.infer<typeof leaveReviewSchema>;
export type IssueLetterInput = z.infer<typeof issueLetterSchema>;
