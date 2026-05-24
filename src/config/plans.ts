export const PLAN_CONFIG = {
  free: {
    code: "free",
    name: "Free",
    price: 0,
    discountPercent: 0,
    durationDays: null,
    description: "Akses dasar untuk mulai latihan dan mengenal pola soal.",
    limits: {
      practiceSessionsPerMonth: 5,
      quizSessionsPerMonth: 2,
      tryoutSessionsPerMonth: 1,
      aiExplanationsPerMonth: 10,
    },
    access: {
      freePractices: true,
      paidPractices: false,
      freeTryouts: true,
      paidTryouts: false,
      ranking: false,
    },
  },
  pro: {
    code: "pro",
    name: "Pro",
    price: 50000,
    discountPercent: 25,
    durationDays: 30,
    description: "Akses lebih luas untuk latihan rutin dan tryout bulanan.",
    limits: {
      practiceSessionsPerMonth: 50,
      quizSessionsPerMonth: 20,
      tryoutSessionsPerMonth: 5,
      aiExplanationsPerMonth: 250,
    },
    access: {
      freePractices: true,
      paidPractices: true,
      freeTryouts: true,
      paidTryouts: true,
      ranking: true,
    },
  },
  max: {
    code: "max",
    name: "Max",
    price: 100000,
    discountPercent: 50,
    durationDays: 30,
    description: "Akses lengkap untuk persiapan intensif lintas tes.",
    limits: {
      practiceSessionsPerMonth: null,
      quizSessionsPerMonth: null,
      tryoutSessionsPerMonth: null,
      aiExplanationsPerMonth: null,
    },
    access: {
      freePractices: true,
      paidPractices: true,
      freeTryouts: true,
      paidTryouts: true,
      ranking: true,
    },
  },
} as const;

export type PlanCode = keyof typeof PLAN_CONFIG;
