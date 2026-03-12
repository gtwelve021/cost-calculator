import { describe, expect, it } from 'vitest'
import { defaultCalculatorState } from '../config/calculatorConfig'
import { getSubmissionIssues, isLeadFormComplete } from './gating'

describe('isLeadFormComplete', () => {
  it('returns false for incomplete lead form', () => {
    expect(
      isLeadFormComplete({
        fullName: '',
        phone: '',
        email: '',
        consent: false,
      }),
    ).toBe(false)
  })

  it('returns true for valid values and consent', () => {
    expect(
      isLeadFormComplete({
        fullName: 'Ali Khan',
        phone: '+971501234567',
        email: 'ali@example.com',
        consent: true,
      }),
    ).toBe(true)
  })

  it('returns true when required fields are filled even if values are not format-validated', () => {
    expect(
      isLeadFormComplete({
        fullName: 'Ali123',
        phone: '123',
        email: 'not-an-email',
        consent: true,
      }),
    ).toBe(false)
  })
})

describe('getSubmissionIssues', () => {
  it('flags missing requirements', () => {
    const issues = getSubmissionIssues(
      {
        ...defaultCalculatorState,
        leadForm: {
          fullName: '',
          phone: '',
          email: '',
          consent: false,
        },
        selectedLicenseId: null,
        selectedActivityIds: [],
        selectedVisaId: null,
      },
      1,
    )

    expect(issues).toContain('Lead form is incomplete.')
    expect(issues).toContain('Choose one business license package.')
    expect(issues).toContain('Pick at least 1 business activity.')
    expect(issues).toContain('Select one visa path.')
  })

  it('returns no issues for complete state', () => {
    const issues = getSubmissionIssues(
      {
        ...defaultCalculatorState,
        leadForm: {
          fullName: 'Ali Khan',
          phone: '+971501234567',
          email: 'ali@example.com',
          consent: true,
        },
        selectedLicenseId: 'launch-license',
        selectedVisaId: 'no-visa',
        selectedActivityIds: ['act-001'],
      },
      1,
    )

    expect(issues).toHaveLength(0)
  })
})
