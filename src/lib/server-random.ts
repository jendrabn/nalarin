import "server-only"

import { randomInt, randomUUID } from "node:crypto"

export function shuffleWithSecureRandom<T>(items: T[]) {
  const output = [...items]

  for (let index = output.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(index + 1)
    ;[output[index], output[randomIndex]] = [output[randomIndex], output[index]]
  }

  return output
}

export function randomBoolean() {
  return randomInt(2) === 0
}

export function createServerSessionId() {
  return randomUUID()
}
