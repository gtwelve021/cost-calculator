import { z } from 'zod'

const leadEmailSchema = z.string().trim().email()

export function isValidLeadEmail(email: string): boolean {
  return leadEmailSchema.safeParse(email).success
}