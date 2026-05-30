type MaterialAccessInput = {
  isFree: boolean
  hasPremiumAccess: boolean
}

export function canAccessMaterial({ isFree, hasPremiumAccess }: MaterialAccessInput) {
  return isFree || hasPremiumAccess
}
