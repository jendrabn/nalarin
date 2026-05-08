import 'dotenv/config';

import { sql } from 'drizzle-orm';

import { db, pool, schema } from '@/db';
import { hashPassword } from '@/lib/password';

const examTypeSeeds = [
  {
    name: 'UTBK',
    slug: 'utbk',
    description: 'Ujian Tulis Berbasis Komputer untuk persiapan masuk PTN.',
  },
  {
    name: 'UTUL UGM',
    slug: 'utul-ugm',
    description: 'Jalur ujian mandiri Universitas Gadjah Mada.',
  },
  {
    name: 'SIMAK UI',
    slug: 'simak-ui',
    description: 'Seleksi Masuk Universitas Indonesia untuk berbagai jenjang.',
  },
  ];

async function seedExamTypes() {
  await db
    .insert(schema.examTypes)
    .values(examTypeSeeds)
    .onDuplicateKeyUpdate({
      set: {
        name: sql`values(${schema.examTypes.name})`,
        description: sql`values(${schema.examTypes.description})`,
        updatedAt: new Date(),
      },
    });
}

async function seedUsers() {
  const [userPasswordHash, adminPasswordHash] = await Promise.all([
    hashPassword('user123'),
    hashPassword('admin123'),
  ]);

  const now = new Date();

  await db
    .insert(schema.users)
    .values([
      {
        name: 'Seed User',
        email: 'user@mail.com',
        passwordHash: userPasswordHash,
        role: 'user',
        status: 'active',
        emailVerifiedAt: now,
      },
      {
        name: 'Seed Admin',
        email: 'admin@mail.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        status: 'active',
        emailVerifiedAt: now,
      },
    ])
    .onDuplicateKeyUpdate({
      set: {
        name: sql`values(${schema.users.name})`,
        passwordHash: sql`values(${schema.users.passwordHash})`,
        role: sql`values(${schema.users.role})`,
        status: sql`values(${schema.users.status})`,
        emailVerifiedAt: sql`values(${schema.users.emailVerifiedAt})`,
        updatedAt: now,
      },
    });
}

async function main() {
  await seedExamTypes();
  await seedUsers();
}

main()
  .then(async () => {
    console.log('Seed completed: exam_types and users upserted.');
    await pool.end();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await pool.end();
    process.exit(1);
  });
