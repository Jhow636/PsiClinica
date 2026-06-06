import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL ?? 'psi@psiclinica.com';
  const password = process.env.SEED_PASSWORD ?? 'senha123';
  const name = process.env.SEED_NAME ?? 'Psicanalista';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuário ${email} já existe, pulando seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      clinic: {
        create: { name: 'Meu Consultório' },
      },
    },
  });

  console.log(`Usuário criado: ${user.email} (id: ${user.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
