type PracticeAccessInput = {
  isFree: boolean
  hasPremiumAccess: boolean
}

export function canAccessPractice({ isFree, hasPremiumAccess }: PracticeAccessInput) {
  return isFree || hasPremiumAccess
}
