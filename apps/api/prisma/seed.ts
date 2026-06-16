import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('hradmin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@hrportal.local' },
    update: {},
    create: {
      email: 'admin@hrportal.local',
      passwordHash,
      name: 'HR Admin',
      role: 'hr_admin',
    },
  });

  const company = {
    name: 'Neurolyx Technologies Pvt Ltd',
    address: 'Prestige Tech Park, Outer Ring Road\nBengaluru, Karnataka 560103',
    signatoryName: 'Priya Sharma',
    signatoryTitle: 'Head of Human Resources',
  };
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: company,
    create: { id: 'default', ...company },
  });

  const email = {
    smtpHost: 'localhost',
    smtpPort: 1025,
    fromEmail: 'hr@neurolyx.com',
    fromName: 'Neurolyx HR',
  };
  await prisma.emailSettings.upsert({
    where: { id: 'default' },
    update: email,
    create: { id: 'default', ...email },
  });

  const existing = await prisma.employee.count();
  if (existing === 0) {
    await prisma.employee.createMany({
      data: [
        {
          firstName: 'Arjun',
          lastName: 'Mehta',
          email: 'arjun.mehta@neurolyx.com',
          phone: '+91 98450 11223',
          department: 'Engineering',
          jobTitle: 'Senior Software Engineer',
          joinDate: new Date('2024-03-15'),
          salary: 2400000,
          currency: 'INR',
          status: 'active',
        },
        {
          firstName: 'Sneha',
          lastName: 'Nair',
          email: 'sneha.nair@neurolyx.com',
          phone: '+91 99020 44556',
          department: 'Marketing',
          jobTitle: 'Marketing Manager',
          joinDate: new Date('2025-01-10'),
          salary: 1800000,
          currency: 'INR',
          status: 'onboarding',
        },
      ],
    });
  }

  console.log('Seed complete. Login: admin@hrportal.local / hradmin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
