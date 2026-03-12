import { z } from 'zod'
import type { CalculatorState } from '../types/calculator'

export const CALCULATOR_STATE_KEY = 'calculator_state_v2'

const leadFormSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  email: z.string(),
  consent: z.boolean(),
})

const calculatorStateSchema = z.object({
  leadForm: leadFormSchema,
  selectedLicenseId: z.string().nullable(),
  durationYears: z.number().int().min(0).max(6),
  shareholderCount: z.number().int().min(0).max(6),
  selectedActivityIds: z.array(z.string()),
  selectedVisaId: z.string().nullable(),
  selectedAddOnIds: z.array(z.string()),
})

export function saveCalculatorState(state: CalculatorState): void {
  if (typeof window === 'undefined') {
    return
  }

  const storage = window.localStorage as Partial<Storage> | undefined
  if (!storage || typeof storage.setItem !== 'function') {
    return
  }

  storage.setItem(CALCULATOR_STATE_KEY, JSON.stringify(state))
}

export function loadCalculatorState(): CalculatorState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storage = window.localStorage as Partial<Storage> | undefined
  if (!storage || typeof storage.getItem !== 'function') {
    return null
  }

  const raw = storage.getItem(CALCULATOR_STATE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    return calculatorStateSchema.parse(parsed)
  } catch {
    return null
  }
}
