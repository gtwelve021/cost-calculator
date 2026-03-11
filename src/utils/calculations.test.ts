import { describe, expect, it } from 'vitest'
import {
  addOnOptions,
  businessActivities,
  defaultCalculatorState,
  licenseOptions,
  pricingConfig,
  visaOptions,
} from '../config/calculatorConfig'
import { calculateQuote } from './calculations'
import { formatAed } from './currency'

describe('calculateQuote', () => {
  it('returns a different total when license changes', () => {
    const launchState = {
      ...defaultCalculatorState,
      selectedLicenseId: licenseOptions[0].id,
    }

    const growthState = {
      ...defaultCalculatorState,
      selectedLicenseId: licenseOptions[1].id,
    }

    const launchQuote = calculateQuote(launchState, pricingConfig, {
      licenses: licenseOptions,
      activities: businessActivities,
      visas: visaOptions,
      addOns: addOnOptions,
    })

    const growthQuote = calculateQuote(growthState, pricingConfig, {
      licenses: licenseOptions,
      activities: businessActivities,
      visas: visaOptions,
      addOns: addOnOptions,
    })

    expect(growthQuote.total).toBeGreaterThan(launchQuote.total)
  })

  it('applies duration and extra shareholder deltas', () => {
    const state = {
      ...defaultCalculatorState,
      durationYears: 4,
      shareholderCount: 3,
    }

    const quote = calculateQuote(state, pricingConfig, {
      licenses: licenseOptions,
      activities: businessActivities,
      visas: visaOptions,
      addOns: addOnOptions,
    })

    expect(quote.durationDelta).toBe(pricingConfig.durations[4])
    expect(quote.shareholderDelta).toBe(2 * pricingConfig.extraShareholderFee)
  })

  it('includes activities, visa, and add-ons in final total', () => {
    const state = {
      ...defaultCalculatorState,
      selectedActivityIds: [businessActivities[0].id, businessActivities[1].id],
      selectedVisaId: visaOptions[1].id,
      selectedAddOnIds: [addOnOptions[0].id, addOnOptions[3].id],
    }

    const quote = calculateQuote(state, pricingConfig, {
      licenses: licenseOptions,
      activities: businessActivities,
      visas: visaOptions,
      addOns: addOnOptions,
    })

    const expectedActivities = businessActivities[0].fee + businessActivities[1].fee
    const expectedAddOns = addOnOptions[0].fee + addOnOptions[3].fee

    expect(quote.activitiesTotal).toBe(expectedActivities)
    expect(quote.visaTotal).toBe(visaOptions[1].fee)
    expect(quote.addOnsTotal).toBe(expectedAddOns)
    expect(quote.total).toBe(
      quote.licenseBase +
        quote.durationDelta +
        quote.shareholderDelta +
        quote.activitiesTotal +
        quote.visaTotal +
        quote.addOnsTotal +
        quote.platformFee,
    )
  })
})

describe('formatAed', () => {
  it('formats numbers with AED currency', () => {
    expect(formatAed(15000)).toContain('AED')
  })
})
