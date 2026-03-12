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
  const visa = sources.visas.find((item) => item.id === state.selectedVisaId)

  const addOnMap = new Map(sources.addOns.map((item) => [item.id, item]))
  const activityMap = new Map(sources.activities.map((item) => [item.id, item]))

  const licenseBase = license?.basePrice ?? 0
  const durationDelta = license ? config.durations[state.durationYears] ?? 0 : 0
  const shareholderDelta =
    license && state.shareholderCount > 0
      ? Math.max(0, state.shareholderCount - 1) * config.extraShareholderFee
      : 0

  const activitiesTotal = state.selectedActivityIds.reduce((sum, id) => {
    return sum + (activityMap.get(id)?.fee ?? 0)
  }, 0)

  const visaTotal = visa?.fee ?? 0

  const addOnsTotal = state.selectedAddOnIds.reduce((sum, id) => {
    return sum + (addOnMap.get(id)?.fee ?? 0)
  }, 0)

  const hasSelections =
    Boolean(license) ||
    Boolean(visa) ||
    state.selectedActivityIds.length > 0 ||
    state.selectedAddOnIds.length > 0
  const subtotal = licenseBase + durationDelta + shareholderDelta + activitiesTotal + visaTotal + addOnsTotal
  const platformFee = hasSelections ? config.platformFee : 0
  const total = subtotal + platformFee

  return {
    currency: config.currency,
    licenseBase: round(licenseBase),
    durationDelta: round(durationDelta),
    shareholderDelta: round(shareholderDelta),
    activitiesTotal: round(activitiesTotal),
    visaTotal: round(visaTotal),
    addOnsTotal: round(addOnsTotal),
    platformFee: round(platformFee),
    subtotal: round(subtotal),
    total: round(total),
  }
}
