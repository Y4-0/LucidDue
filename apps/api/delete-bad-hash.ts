import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.account.deleteMany({
    where: {
      providerId: 'credential',
      password: { startsWith: '$2b$' }
    }
  });
  console.log("Deleted accounts:", result.count);
}
main().finally(() => prisma.$disconnect());
