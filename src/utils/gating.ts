import type { CalculatorState, LeadFormData } from '../types/calculator'

const phonePattern = /^[+]?\d[\d\s()-]{7,20}$/

export function isLeadFormComplete(data: LeadFormData): boolean {
  const fullNameValid = data.fullName.trim().length >= 2
  const phoneValid = phonePattern.test(data.phone.trim())
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())

  return fullNameValid && phoneValid && emailValid && data.consent
}

export function getSubmissionIssues(state: CalculatorState, minimumActivities: number): string[] {
  const issues: string[] = []

  if (!isLeadFormComplete(state.leadForm)) {
    issues.push('Lead form is incomplete.')
  }

  if (!state.selectedLicenseId) {
    issues.push('Choose one business license package.')
  }

  if (state.selectedActivityIds.length < minimumActivities) {
    issues.push(`Pick at least ${minimumActivities} business activity.`)
  }

  if (!state.selectedVisaId) {
    issues.push('Select one visa path.')
  }

  return issues
}
