import { describe, expect, it } from 'vitest'
import { defaultCalculatorState } from '../config/calculatorConfig'
import { CALCULATOR_STATE_KEY, loadCalculatorState, saveCalculatorState } from './persistence'

describe('persistence', () => {
  it('saves and restores calculator state', () => {
    const state = {
      ...defaultCalculatorState,
      leadForm: {
        fullName: 'Ali Khan',
        phone: '+971501234567',
        email: 'ali@example.com',
        consent: true,
      },
      durationYears: 2,
      shareholderCount: 3,
      selectedActivityIds: ['act-001'],
      selectedAddOnIds: ['bookkeeping-suite'],
    }

    saveCalculatorState(state)
    const restored = loadCalculatorState()

    expect(restored).toEqual(state)
  })

  it('returns null for invalid stored payload', () => {
    window.localStorage.setItem(CALCULATOR_STATE_KEY, '{"bad":"payload"}')

    expect(loadCalculatorState()).toBeNull()
  })
})
