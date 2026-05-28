type TryoutAccessInput = {
  isFree: boolean
  hasPremiumAccess: boolean
}

export function canAccessTryout({ isFree, hasPremiumAccess }: TryoutAccessInput) {
  return isFree || hasPremiumAccess
}
