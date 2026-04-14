import type { CalculatorState, PricingConfig, QuoteBreakdown, QuoteSources } from '../types/calculator'

function round(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculateQuote(
  state: CalculatorState,
  config: PricingConfig,
  sources: QuoteSources,
): QuoteBreakdown {
  const license = sources.licenses.find((item) => item.id === state.selectedLicenseId)
  const addOnMap = new Map(sources.addOns.map((item) => [item.id, item]))
  const totalVisaApplicants =
    (state.investorVisaEnabled ? 1 : 0) + state.employeeVisaCount + state.dependentVisaCount

  const licenseBase = license?.basePrice ?? 0
  const durationDelta = license ? config.durations[state.durationYears] ?? 0 : 0
  const shareholderDelta =
    license && state.shareholderCount > config.includedShareholders
      ? (state.shareholderCount - config.includedShareholders) * config.extraShareholderFee
      : 0

  const includedActivities = Math.min(state.selectedActivityIds.length, config.includedActivityCount)
  const extraActivityCount = Math.max(0, state.selectedActivityIds.length - config.includedActivityCount)
  const activitiesTotal = extraActivityCount * config.extraActivityFee

  const investorVisa = sources.visas.find((item) => item.id === 'investor-visa')
  const employeeVisa = sources.visas.find((item) => item.id === 'employee-visa')
  const dependentVisa = sources.visas.find((item) => item.id === 'dependent-visa')

  const investorVisaTotal = state.investorVisaEnabled ? investorVisa?.fee ?? 0 : 0
  const employeeVisaTotal = state.employeeVisaCount * (employeeVisa?.fee ?? 0)
  const dependentVisaTotal = state.dependentVisaCount * (dependentVisa?.fee ?? 0)
  const visaAllocationFee = totalVisaApplicants > 0 ? config.visaAllocationFee : 0
  const immigrationCardFee = totalVisaApplicants > 0 ? config.immigrationCardFee : 0
  const visaTotal =
    investorVisaTotal +
    employeeVisaTotal +
    dependentVisaTotal +
    visaAllocationFee +
    immigrationCardFee

  const applicantsInsideUae = Math.min(state.applicantsInsideUae, totalVisaApplicants)
  const insideStatusTotal = applicantsInsideUae * config.changeStatusInsideFee
  const outsideStatusTotal = 0
  const changeStatusTotal = insideStatusTotal + outsideStatusTotal

  const addOnsTotal = state.selectedAddOnIds.reduce((sum, id) => {
    return sum + (addOnMap.get(id)?.fee ?? 0)
  }, 0)

  const companySetupTotal = licenseBase + durationDelta + shareholderDelta
  const subtotal = companySetupTotal + activitiesTotal + visaTotal + changeStatusTotal + addOnsTotal

  return {
    currency: config.currency,
    companySetupTotal: round(companySetupTotal),
    licenseBase: round(licenseBase),
    durationDelta: round(durationDelta),
    shareholderDelta: round(shareholderDelta),
    activitiesTotal: round(activitiesTotal),
    includedActivities,
    extraActivityCount,
    investorVisaTotal: round(investorVisaTotal),
    employeeVisaTotal: round(employeeVisaTotal),
    dependentVisaTotal: round(dependentVisaTotal),
    visaAllocationFee: round(visaAllocationFee),
    immigrationCardFee: round(immigrationCardFee),
    visaTotal: round(visaTotal),
    insideStatusTotal: round(insideStatusTotal),
    outsideStatusTotal: round(outsideStatusTotal),
    changeStatusTotal: round(changeStatusTotal),
    addOnsTotal: round(addOnsTotal),
    subtotal: round(subtotal),
    total: round(subtotal),
  }
}
