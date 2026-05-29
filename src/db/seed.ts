import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db, pool, schema } from '@/db';
import { hashPassword } from '@/lib/password';

const taxonomySeedItemSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  order_index: z.number().int().positive().optional(),
});

const optionalDateTimeSeedSchema = z
  .string()
  .trim()
  .datetime()
  .nullable()
  .optional()
  .transform((value) => (value ? new Date(value) : null));

const examTypeSeedItemSchema = taxonomySeedItemSchema.extend({
  logoUrl: z.string().trim().max(2048).nullable().optional(),
  coverUrl: z.string().trim().max(2048).nullable().optional(),
  countdownTitle: z.string().trim().max(255).nullable().optional(),
  countdownTargetAt: optionalDateTimeSeedSchema,
  registrationStartAt: optionalDateTimeSeedSchema,
  registrationEndAt: optionalDateTimeSeedSchema,
  examStartAt: optionalDateTimeSeedSchema,
  examEndAt: optionalDateTimeSeedSchema,
  announcementAt: optionalDateTimeSeedSchema,
  informationContent: z.string().trim().nullable().optional(),
});

const subjectSeedItemSchema = taxonomySeedItemSchema.extend({
  exam_type_slug: z.string().trim().min(1),
});

const topicSeedItemSchema = taxonomySeedItemSchema.extend({
  subject_slug: z.string().trim().min(1),
});

const seedDataSchema = z.object({
  exam_types: z.array(examTypeSeedItemSchema).min(1),
  exam_type_packages: z
    .array(
      z.object({
        is_active: z.boolean().optional(),
        practice_quota_per_month: z.number().int(),
        quiz_quota_per_month: z.number().int(),
        tryout_quota_per_month: z.number().int(),
        ai_explanation_quota_per_month: z.number().int(),
        premium_practices_enabled: z.boolean(),
        premium_tryouts_enabled: z.boolean(),
        ranking_enabled: z.boolean(),
      }),
    )
    .length(1),
  exam_type_package_prices: z
    .array(
      z.object({
        duration_months: z.number().int().min(1),
        price: z.number().int().min(0),
        discount_percent: z.number().int().min(0).max(100),
        is_active: z.boolean().optional(),
      }),
    )
    .min(1),
  subjects: z.array(subjectSeedItemSchema).min(1),
  topics: z.array(topicSeedItemSchema).min(1),
  blog_categories: z.array(taxonomySeedItemSchema).min(1),
});

type SeedData = z.infer<typeof seedDataSchema>;

async function loadSeedData(): Promise<SeedData> {
  const seedPath = join(dirname(fileURLToPath(import.meta.url)), 'seed-data.json');
  const rawSeedData = await readFile(seedPath, 'utf8');
  const parsedSeedData = JSON.parse(rawSeedData) as unknown;

  return seedDataSchema.parse(parsedSeedData);
}

async function seedExamTypes(seedData: SeedData) {
  await db
    .insert(schema.examTypes)
    .values(
      seedData.exam_types.map((examType) => ({
        name: examType.name,
        slug: examType.slug,
        description: examType.description ?? null,
        logoUrl: examType.logoUrl ?? null,
        coverUrl: examType.coverUrl ?? examType.logoUrl ?? null,
        countdownTitle: examType.countdownTitle ?? null,
        countdownTargetAt: examType.countdownTargetAt,
        registrationStartAt: examType.registrationStartAt,
        registrationEndAt: examType.registrationEndAt,
        examStartAt: examType.examStartAt,
        examEndAt: examType.examEndAt,
        announcementAt: examType.announcementAt,
        informationContent: examType.informationContent ?? null,
      })),
    )
    .onDuplicateKeyUpdate({
      set: {
        name: sql`values(${schema.examTypes.name})`,
        description: sql`values(${schema.examTypes.description})`,
        logoUrl: sql`values(${schema.examTypes.logoUrl})`,
        coverUrl: sql`values(${schema.examTypes.coverUrl})`,
        countdownTitle: sql`values(${schema.examTypes.countdownTitle})`,
        countdownTargetAt: sql`values(${schema.examTypes.countdownTargetAt})`,
        registrationStartAt: sql`values(${schema.examTypes.registrationStartAt})`,
        registrationEndAt: sql`values(${schema.examTypes.registrationEndAt})`,
        examStartAt: sql`values(${schema.examTypes.examStartAt})`,
        examEndAt: sql`values(${schema.examTypes.examEndAt})`,
        announcementAt: sql`values(${schema.examTypes.announcementAt})`,
        informationContent: sql`values(${schema.examTypes.informationContent})`,
        updatedAt: new Date(),
      },
    });
}

async function getExamTypeIdBySlug() {
  const rows = await db
    .select({
      id: schema.examTypes.id,
      slug: schema.examTypes.slug,
    })
    .from(schema.examTypes);

  return new Map(rows.map((row) => [row.slug, row.id]));
}

async function getSubjectIdBySlug() {
  const rows = await db
    .select({
      id: schema.subjects.id,
      slug: schema.subjects.slug,
    })
    .from(schema.subjects);

  const subjectIds = new Map<string, number>();
  const duplicateSlugs = new Set<string>();

  rows.forEach((row) => {
    if (subjectIds.has(row.slug)) {
      duplicateSlugs.add(row.slug);
      return;
    }

    subjectIds.set(row.slug, row.id);
  });

  if (duplicateSlugs.size > 0) {
    throw new Error(
      `Cannot seed topics because subject_slug is ambiguous: ${Array.from(duplicateSlugs).join(', ')}`,
    );
  }

  return subjectIds;
}

async function seedExamTypePackages(seedData: SeedData) {
  const [packageTemplate] = seedData.exam_type_packages;

  const examTypes = await db
    .select({
      id: schema.examTypes.id,
    })
    .from(schema.examTypes);

  for (const examType of examTypes) {
    const [pkg] = await db
      .insert(schema.examTypePackages)
      .values({
        examTypeId: examType.id,
        isActive: packageTemplate.is_active ?? true,
        practiceQuotaPerMonth: packageTemplate.practice_quota_per_month,
        quizQuotaPerMonth: packageTemplate.quiz_quota_per_month,
        tryoutQuotaPerMonth: packageTemplate.tryout_quota_per_month,
        aiExplanationQuotaPerMonth: packageTemplate.ai_explanation_quota_per_month,
        premiumPracticesEnabled: packageTemplate.premium_practices_enabled,
        premiumTryoutsEnabled: packageTemplate.premium_tryouts_enabled,
        rankingEnabled: packageTemplate.ranking_enabled,
      })
      .onDuplicateKeyUpdate({
        set: {
          updatedAt: new Date(),
        },
      })
      .$returningId();

    const packageId =
      pkg?.id ??
      (
        await db.query.examTypePackages.findFirst({
          where: eq(schema.examTypePackages.examTypeId, examType.id),
          columns: { id: true },
        })
      )?.id;

    if (!packageId) {
      continue;
    }

    await db
      .insert(schema.examTypePackagePrices)
      .values(
        seedData.exam_type_package_prices.map((price) => ({
          packageId,
          durationMonths: price.duration_months,
          price: price.price,
          discountPercent: price.discount_percent,
          isActive: price.is_active ?? true,
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          updatedAt: new Date(),
        },
      });
  }
}

async function seedSubjects(seedData: SeedData) {
  const examTypeIds = await getExamTypeIdBySlug();
  const subjectValues = seedData.subjects.map((subject) => {
    const examTypeId = examTypeIds.get(subject.exam_type_slug);

    if (!examTypeId) {
      throw new Error(`Exam type not found for subject seed: ${subject.exam_type_slug}`);
    }

    return {
      examTypeId,
      name: subject.name,
      slug: subject.slug,
      description: subject.description ?? null,
    };
  });

  await db
    .insert(schema.subjects)
    .values(subjectValues)
    .onDuplicateKeyUpdate({
      set: {
        examTypeId: sql`values(${schema.subjects.examTypeId})`,
        name: sql`values(${schema.subjects.name})`,
        description: sql`values(${schema.subjects.description})`,
        updatedAt: new Date(),
      },
    });
}

async function seedTopics(seedData: SeedData) {
  const subjectIds = await getSubjectIdBySlug();
  const topicValues = seedData.topics.map((topic) => {
    const subjectId = subjectIds.get(topic.subject_slug);

    if (!subjectId) {
      throw new Error(`Subject not found for topic seed: ${topic.subject_slug}`);
    }

    return {
      subjectId,
      name: topic.name,
      slug: topic.slug,
      description: topic.description ?? null,
    };
  });

  await db
    .insert(schema.topics)
    .values(topicValues)
    .onDuplicateKeyUpdate({
      set: {
        subjectId: sql`values(${schema.topics.subjectId})`,
        name: sql`values(${schema.topics.name})`,
        description: sql`values(${schema.topics.description})`,
        updatedAt: new Date(),
      },
    });
}

async function seedBlogCategories(seedData: SeedData) {
  await db
    .insert(schema.blogCategories)
    .values(
      seedData.blog_categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        description: category.description ?? null,
      })),
    )
    .onDuplicateKeyUpdate({
      set: {
        name: sql`values(${schema.blogCategories.name})`,
        description: sql`values(${schema.blogCategories.description})`,
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
  const seedData = await loadSeedData();

  await seedExamTypes(seedData);
  await seedExamTypePackages(seedData);
  await seedSubjects(seedData);
  await seedTopics(seedData);
  await seedBlogCategories(seedData);
  await seedUsers();
}

main()
  .then(async () => {
    console.log(
      'Seed completed: exam_types, exam_type_package_prices, subjects, topics, blog_categories, and users upserted.',
    );
    await pool.end();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await pool.end();
    process.exit(1);
  });
