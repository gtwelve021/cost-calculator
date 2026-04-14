import { useEffect, useState } from 'react'
import type { SheetPricingData } from '../utils/sheets'
import { fetchSheetData } from '../utils/sheets'
import {
  addOnOptions as defaultAddOns,
  businessActivities as defaultActivities,
  licenseOptions as defaultLicenses,
  pricingConfig as defaultPricing,
  visaOptions as defaultVisas,
} from '../config/calculatorConfig'
import type {
  AddOnOption,
  BusinessActivity,
  LicenseOption,
  PricingConfig,
  VisaOption,
} from '../types/calculator'

interface SheetConfig {
  licenses: LicenseOption[]
  visas: VisaOption[]
  addOns: AddOnOption[]
  activities: BusinessActivity[]
  pricingConfig: PricingConfig
  isLoading: boolean
}

function mergeWithDefaults(sheetData: SheetPricingData | null): Omit<SheetConfig, 'isLoading'> {
  if (!sheetData) {
    return {
      licenses: defaultLicenses,
      visas: defaultVisas,
      addOns: defaultAddOns,
      activities: defaultActivities,
      pricingConfig: defaultPricing,
    }
  }

  const licenses = sheetData.licenses
    ? defaultLicenses.map((license) => {
        const sheetLicense = sheetData.licenses!.find(
          (item) => item.id === license.id || item.name.toLowerCase() === license.name.toLowerCase(),
        )
        return sheetLicense ? { ...license, basePrice: sheetLicense.basePrice } : license
      })
    : defaultLicenses

  const visas = sheetData.visas
    ? defaultVisas.map((visa) => {
        const sheetVisa = sheetData.visas!.find(
          (item) => item.id === visa.id || item.name.toLowerCase() === visa.name.toLowerCase(),
        )
        return sheetVisa ? { ...visa, fee: sheetVisa.fee } : visa
      })
    : defaultVisas

  const addOns = sheetData.addOns
    ? defaultAddOns.map((addOn) => {
        const sheetAddOn = sheetData.addOns!.find(
          (item) => item.id === addOn.id || item.name.toLowerCase() === addOn.name.toLowerCase(),
        )
        return sheetAddOn ? { ...addOn, fee: sheetAddOn.fee } : addOn
      })
    : defaultAddOns

  const pricingConfig: PricingConfig = {
    ...defaultPricing,
    ...(sheetData.durations && Object.keys(sheetData.durations).length > 0
      ? { durations: { ...defaultPricing.durations, ...sheetData.durations } }
      : {}),
    ...(sheetData.config?.extraShareholderFee !== undefined
      ? { extraShareholderFee: sheetData.config.extraShareholderFee }
      : {}),
    ...(sheetData.config?.includedShareholders !== undefined
      ? { includedShareholders: sheetData.config.includedShareholders }
      : {}),
    ...(sheetData.config?.includedActivityCount !== undefined
      ? { includedActivityCount: sheetData.config.includedActivityCount }
      : {}),
    ...(sheetData.config?.extraActivityFee !== undefined
      ? { extraActivityFee: sheetData.config.extraActivityFee }
      : {}),
    ...(sheetData.config?.visaAllocationFee !== undefined
      ? { visaAllocationFee: sheetData.config.visaAllocationFee }
      : {}),
    ...(sheetData.config?.immigrationCardFee !== undefined
      ? { immigrationCardFee: sheetData.config.immigrationCardFee }
      : {}),
    ...(sheetData.config?.changeStatusInsideFee !== undefined
      ? { changeStatusInsideFee: sheetData.config.changeStatusInsideFee }
      : {}),
  }

  return {
    licenses,
    visas,
    addOns,
    activities: defaultActivities,
    pricingConfig,
  }
}

export function useSheetData(): SheetConfig {
  const [sheetData, setSheetData] = useState<SheetPricingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchSheetData().then((data) => {
      if (!cancelled) {
        setSheetData(data)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const merged = mergeWithDefaults(sheetData)

  return {
    ...merged,
    isLoading,
  }
}
