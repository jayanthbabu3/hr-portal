export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  department: string;
  jobTitle: string;
  joinDate: string;
  lastWorkingDay?: string | null;
  salary: number;
  currency: string;
  status: 'onboarding' | 'active' | 'offboarding' | 'terminated';
  documents?: Document[];
  payslips?: Payslip[];
};

export type Document = {
  id: string;
  employeeId: string;
  type: string;
  fileName: string;
  version: number;
  generatedAt: string;
  sentAt?: string | null;
  sentTo?: string | null;
  employee?: { firstName: string; lastName: string; email: string };
};

export type Payslip = {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  earnings: number;
  deductions: number;
  netPay: number;
  document?: Document | null;
  employee?: { firstName: string; lastName: string };
};

export type Template = {
  id: string;
  type: string;
  htmlBody: string;
  subject?: string | null;
};

export type DashboardData = {
  stats: {
    totalEmployees: number;
    onboarding: number;
    offboarding: number;
    pendingSends: number;
  };
  recentDocuments: Document[];
  recentAudit: { action: string; details?: string; createdAt: string; user?: { name: string } }[];
};
