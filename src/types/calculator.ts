export interface LeadFormData {
  fullName: string
  phone: string
  email: string
  consent: boolean
}

export interface HeaderNavSection {
  label: string
  items?: string[]
}

export interface FooterLinkGroup {
  id: string
  title: string
  links: string[]
}

export interface ChatWidgetCopy {
  headline: string
  prompt: string
}

export interface LicenseOption {
  id: string
  name: string
  timeline: string
  tagline: string
  description: string
  features: string[]
  modalCopy: string[]
  basePrice: number
  image: string
  selectLabel: string
}

export interface BusinessActivityCategory {
  id: string
  name: string
  badge: string
  description: string
  accent: string
  image?: string
}

export interface BusinessActivity {
  id: string
  code: string
  categoryId: string
  category: string
  name: string
  description: string
  preApproval?: boolean
}

export interface VisaOption {
  id: string
  name: string
  description: string
  fee: number
  image: string
  ctaLabel: string
  kind: 'toggle' | 'counter'
  modalCopy: string[]
}

export interface AddOnGroup {
  id: string
  name: string
  description: string
  modalCopy: string[]
  itemIds: string[]
}

export interface AddOnOption {
  id: string
  groupId: string
  name: string
  description: string
  fee: number
  recommended?: boolean
}

export interface PricingConfig {
  currency: 'AED'
  extraShareholderFee: number
  includedShareholders: number
  durations: Record<number, number>
  includedActivityCount: number
  extraActivityFee: number
  minimumActivities: number
  immigrationCardFee: number
  changeStatusInsideFee: number
}

export interface CalculatorState {
  leadForm: LeadFormData
  selectedLicenseId: string | null
  durationYears: number
  shareholderCount: number
  selectedActivityIds: string[]
  selectedAddOnIds: string[]
  investorVisaEnabled: boolean
  employeeVisaCount: number
  dependentVisaCount: number
  applicantsInsideUae: number
}

export interface QuoteSources {
  licenses: LicenseOption[]
  activities: BusinessActivity[]
  visas: VisaOption[]
  addOns: AddOnOption[]
}

export interface QuoteBreakdown {
  currency: 'AED'
  companySetupTotal: number
  licenseBase: number
  durationDelta: number
  shareholderDelta: number
  activitiesTotal: number
  includedActivities: number
  extraActivityCount: number
  investorVisaTotal: number
  employeeVisaTotal: number
  dependentVisaTotal: number
  immigrationCardFee: number
  visaTotal: number
  insideStatusTotal: number
  outsideStatusTotal: number
  changeStatusTotal: number
  addOnsTotal: number
  subtotal: number
  total: number
}
