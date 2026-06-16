import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@hr-portal/shared';
import { prisma } from '../lib/prisma.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }
    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });

  app.get('/auth/me', { onRequest: [app.authenticate] }, async (request) => {
    const payload = request.user as { sub: string };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  });
}
