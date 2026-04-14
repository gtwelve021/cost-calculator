import type { CalculatorState, LeadFormData } from '../types/calculator'
import { isValidLeadEmail } from './email'
import { isValidLeadPhoneNumber } from './phone'

export function isLeadFormComplete(data: LeadFormData): boolean {
  const fullNameValid = data.fullName.trim().length > 0
  const residenceCountryValid = data.residenceCountry.trim().length > 0
  const phoneValid = isValidLeadPhoneNumber(data.phone)
  const emailValid = isValidLeadEmail(data.email)

  return fullNameValid && residenceCountryValid && phoneValid && emailValid && data.consent
}

export function getTotalVisaApplicants(state: CalculatorState): number {
  return (state.investorVisaEnabled ? 1 : 0) + state.employeeVisaCount + state.dependentVisaCount
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

  if (getTotalVisaApplicants(state) === 0) {
    issues.push('Select at least one visa requirement.')
  }

  return issues
}
