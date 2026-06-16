import { prisma } from '../lib/prisma.js';
import { env } from '../lib/config.js';

export type CompanyInfo = {
  name: string;
  address: string;
  logoUrl: string;
  signatoryName: string;
  signatoryTitle: string;
  email: string;
  phone: string;
  website: string;
  cin: string;
};

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const settings = await prisma.companySettings.findUnique({
    where: { id: 'default' },
  });
  if (settings) {
    return {
      name: settings.name,
      address: settings.address,
      logoUrl: settings.logoUrl ?? '',
      signatoryName: settings.signatoryName,
      signatoryTitle: settings.signatoryTitle,
      email: env.company.email,
      phone: env.company.phone,
      website: env.company.website,
      cin: env.company.cin,
    };
  }
  return env.company;
}
