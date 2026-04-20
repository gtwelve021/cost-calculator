import { describe, expect, it } from 'vitest'
import { defaultCalculatorState } from '../config/calculatorConfig'
import { getSubmissionIssues, isLeadFormComplete } from './gating'

describe('isLeadFormComplete', () => {
  it('returns false for incomplete lead form', () => {
    expect(
      isLeadFormComplete({
        fullName: '',
        residenceCountry: '',
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
        residenceCountry: 'AE',
        phone: '+971501234567',
        email: 'ali@example.com',
        consent: true,
      }),
    ).toBe(true)
  })

  it('returns false when the phone number format is invalid', () => {
    expect(
      isLeadFormComplete({
        fullName: 'Ali Khan',
        residenceCountry: 'AE',
        phone: '123',
        email: 'ali@example.com',
        consent: true,
      }),
    ).toBe(false)
  })

  it('returns false when the email address format is invalid', () => {
    expect(
      isLeadFormComplete({
        fullName: 'Ali Khan',
        residenceCountry: 'AE',
        phone: '+971501234567',
        email: 'asdadad',
        consent: true,
      }),
    ).toBe(false)
  })
})

describe('getSubmissionIssues', () => {
  it('flags only lead form requirement', () => {
    const issues = getSubmissionIssues(
      {
        ...defaultCalculatorState,
        leadForm: {
          fullName: '',
          residenceCountry: '',
          phone: '',
          email: '',
          consent: false,
        },
      },
      1,
    )

    expect(issues).toContain('Lead form is incomplete.')
    expect(issues).toHaveLength(1)
  })

  it('returns no issues for a complete state', () => {
    const issues = getSubmissionIssues(
      {
        ...defaultCalculatorState,
        leadForm: {
          fullName: 'Ali Khan',
          residenceCountry: 'AE',
          phone: '+971501234567',
          email: 'ali@example.com',
          consent: true,
        },
        selectedLicenseId: 'fawri',
        selectedActivityIds: ['ict-6201-10'],
        investorVisaEnabled: true,
      },
      1,
    )

    expect(issues).toHaveLength(0)
  })
})
