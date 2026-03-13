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
    const fawriQuote = calculateQuote(
      {
        ...defaultCalculatorState,
        selectedLicenseId: licenseOptions[0].id,
      },
      pricingConfig,
      {
        licenses: licenseOptions,
        activities: businessActivities,
        visas: visaOptions,
        addOns: addOnOptions,
      },
    )

    const regularQuote = calculateQuote(
      {
        ...defaultCalculatorState,
        selectedLicenseId: licenseOptions[1].id,
      },
      pricingConfig,
      {
        licenses: licenseOptions,
        activities: businessActivities,
        visas: visaOptions,
        addOns: addOnOptions,
      },
    )

    expect(regularQuote.total).toBeGreaterThan(fawriQuote.total)
  })

  it('applies duration and extra shareholder deltas after the included threshold', () => {
    const quote = calculateQuote(
      {
        ...defaultCalculatorState,
        selectedLicenseId: licenseOptions[0].id,
        durationYears: 4,
        shareholderCount: 8,
      },
      pricingConfig,
      {
        licenses: licenseOptions,
        activities: businessActivities,
        visas: visaOptions,
        addOns: addOnOptions,
      },
    )

    expect(quote.durationDelta).toBe(pricingConfig.durations[4])
    expect(quote.shareholderDelta).toBe(2 * pricingConfig.extraShareholderFee)
  })

  it('charges only for activities above the included three', () => {
    const quote = calculateQuote(
      {
        ...defaultCalculatorState,
        selectedLicenseId: licenseOptions[0].id,
        selectedActivityIds: businessActivities.slice(0, 5).map((activity) => activity.id),
      },
      pricingConfig,
      {
        licenses: licenseOptions,
        activities: businessActivities,
        visas: visaOptions,
        addOns: addOnOptions,
      },
    )

    expect(quote.includedActivities).toBe(3)
    expect(quote.extraActivityCount).toBe(2)
    expect(quote.activitiesTotal).toBe(2 * pricingConfig.extraActivityFee)
  })

  it('adds multi-visa totals, immigration card fee, inside-UAE status changes, and add-ons', () => {
    const employeeFee = visaOptions.find((option) => option.id === 'employee-visa')?.fee ?? 0
    const dependentFee = visaOptions.find((option) => option.id === 'dependent-visa')?.fee ?? 0
    const investorFee = visaOptions.find((option) => option.id === 'investor-visa')?.fee ?? 0
    const addOnFee = addOnOptions[0].fee + addOnOptions[3].fee

    const quote = calculateQuote(
      {
        ...defaultCalculatorState,
        selectedLicenseId: licenseOptions[0].id,
        investorVisaEnabled: true,
        employeeVisaCount: 2,
        dependentVisaCount: 1,
        applicantsInsideUae: 2,
        selectedAddOnIds: [addOnOptions[0].id, addOnOptions[3].id],
      },
      pricingConfig,
      {
        licenses: licenseOptions,
        activities: businessActivities,
        visas: visaOptions,
        addOns: addOnOptions,
      },
    )

    expect(quote.investorVisaTotal).toBe(investorFee)
    expect(quote.employeeVisaTotal).toBe(employeeFee * 2)
    expect(quote.dependentVisaTotal).toBe(dependentFee)
    expect(quote.immigrationCardFee).toBe(pricingConfig.immigrationCardFee)
    expect(quote.changeStatusTotal).toBe(2 * pricingConfig.changeStatusInsideFee)
    expect(quote.addOnsTotal).toBe(addOnFee)
    expect(quote.total).toBe(
      quote.companySetupTotal +
        quote.activitiesTotal +
        quote.visaTotal +
        quote.changeStatusTotal +
        quote.addOnsTotal,
    )
  })
})

describe('formatAed', () => {
  it('formats numbers with AED currency', () => {
    expect(formatAed(15000)).toContain('AED')
  })
})
