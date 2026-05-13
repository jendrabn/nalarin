import { PLAN_CONFIG, type PlanCode } from "@/config/plans"

type PracticeAccessInput = {
  isFree: boolean
  planCode: PlanCode
}

export function canAccessPractice({ isFree, planCode }: PracticeAccessInput) {
  const access = PLAN_CONFIG[planCode].access

  return isFree ? access.freePractices : access.paidPractices
}
