import { describe, expect, it } from 'vitest'
import { defaultCalculatorState } from '../config/calculatorConfig'
import { CALCULATOR_STATE_KEY, loadCalculatorState, saveCalculatorState } from './persistence'

describe('persistence', () => {
  it('saves and restores the v4 calculator state shape', () => {
    const state = {
      ...defaultCalculatorState,
      leadForm: {
        fullName: 'Ali Khan',
        residenceCountry: 'AE',
        phone: '+971501234567',
        email: 'ali@example.com',
        consent: true,
      },
      selectedLicenseId: 'fawri',
      durationYears: 2,
      shareholderCount: 4,
      selectedActivityIds: ['ict-6201-10'],
      selectedAddOnIds: ['bank-account'],
      investorVisaEnabled: true,
      employeeVisaCount: 1,
      dependentVisaCount: 2,
      applicantsInsideUae: 2,
    }

    saveCalculatorState(state)

    expect(loadCalculatorState()).toEqual(state)
  })

  it('returns null for invalid or legacy payloads', () => {
    window.localStorage.setItem(CALCULATOR_STATE_KEY, '{"selectedVisaId":"employee-visa"}')

    expect(loadCalculatorState()).toBeNull()
  })
})
