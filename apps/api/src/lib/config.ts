import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  storagePath: path.resolve(
    process.env.STORAGE_PATH ?? path.join(__dirname, '../../storage'),
  ),
  databaseUrl: process.env.DATABASE_URL ?? '',
  smtp: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    fromEmail: process.env.FROM_EMAIL ?? 'hr@company.com',
    fromName: process.env.FROM_NAME ?? 'HR Portal',
  },
  company: {
    name: process.env.COMPANY_NAME ?? 'Neurolyx Technologies Pvt Ltd',
    address:
      process.env.COMPANY_ADDRESS ??
      'Prestige Tech Park, Outer Ring Road\nBengaluru, Karnataka 560103',
    logoUrl: process.env.COMPANY_LOGO_URL ?? '',
    signatoryName: process.env.SIGNATORY_NAME ?? 'Priya Sharma',
    signatoryTitle: process.env.SIGNATORY_TITLE ?? 'Head of Human Resources',
    email: process.env.COMPANY_EMAIL ?? 'people@neurolyx.com',
    phone: process.env.COMPANY_PHONE ?? '+91 80 4718 2200',
    website: process.env.COMPANY_WEBSITE ?? 'www.neurolyx.com',
    cin: process.env.COMPANY_CIN ?? 'U72900KA2019PTC123456',
  },
};
