export interface LeadFormData {
  fullName: string
  phone: string
  email: string
  consent: boolean
}

export interface LicenseOption {
  id: string
  name: string
  tagline: string
  description: string
  basePrice: number
  features: string[]
  image: string
}

export interface VisaOption {
  id: string
  name: string
  description: string
  fee: number
  image: string
  ctaLabel: string
}

export interface AddOnGroup {
  id: string
  name: string
  description: string
  itemIds: string[]
}

export interface AddOnOption {
  id: string
  groupId: string
  name: string
  description: string
  fee: number
}

export interface BusinessActivity {
  id: string
  code: string
  category: string
  name: string
  description: string
  fee: number
}

export interface PricingConfig {
  currency: 'AED'
  platformFee: number
  extraShareholderFee: number
  durations: Record<number, number>
  activitySelectionLimit: number
  minimumActivities: number
}

export interface CalculatorState {
  leadForm: LeadFormData
  selectedLicenseId: string | null
  durationYears: number
  shareholderCount: number
  selectedActivityIds: string[]
  selectedVisaId: string | null
  selectedAddOnIds: string[]
}

export interface QuoteSources {
  licenses: LicenseOption[]
  activities: BusinessActivity[]
  visas: VisaOption[]
  addOns: AddOnOption[]
}

export interface QuoteBreakdown {
  currency: 'AED'
  licenseBase: number
  durationDelta: number
  shareholderDelta: number
  activitiesTotal: number
  visaTotal: number
  addOnsTotal: number
  platformFee: number
  subtotal: number
  total: number
}
