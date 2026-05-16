import { PLAN_CONFIG, type PlanCode } from "@/config/plans"

type TryoutAccessInput = {
  isFree: boolean
  planCode: PlanCode
}

export function canAccessTryout({ isFree, planCode }: TryoutAccessInput) {
  const access = PLAN_CONFIG[planCode].access

  return isFree ? access.freeTryouts : access.paidTryouts
}
