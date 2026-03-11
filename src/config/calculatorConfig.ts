import heroArtwork from '../assets/artwork/01_cc-image.webp'
import launchLicenseArtwork from '../assets/artwork/license-launch.svg'
import growthLicenseArtwork from '../assets/artwork/license-growth.svg'
import investorVisaArtwork from '../assets/artwork/visa-investor.svg'
import employeeVisaArtwork from '../assets/artwork/visa-employee.svg'
import dependentVisaArtwork from '../assets/artwork/visa-dependent.svg'
import type {
  AddOnGroup,
  AddOnOption,
  BusinessActivity,
  CalculatorState,
  LeadFormData,
  LicenseOption,
  PricingConfig,
  VisaOption,
} from '../types/calculator'

export const heroImage = heroArtwork

export const licenseOptions: LicenseOption[] = [
  {
    id: 'launch-license',
    name: 'Launch License',
    tagline: 'Fast-track essentials for first-time founders.',
    description:
      'Built for lean operators who need rapid setup with core legal and operational flexibility.',
    basePrice: 10950,
    features: ['Single founder friendly', 'Core banking support', 'Up to 3 activity selections'],
    image: launchLicenseArtwork,
  },
  {
    id: 'growth-license',
    name: 'Growth License',
    tagline: 'Strategic structure for scaling companies.',
    description:
      'Designed for teams expecting expansion, multiple service lines, and stronger operational depth.',
    basePrice: 14650,
    features: ['Premium setup advisory', 'Priority processing lane', 'Expanded activity flexibility'],
    image: growthLicenseArtwork,
  },
]

export const visaOptions: VisaOption[] = [
  {
    id: 'no-visa',
    name: 'Investor Visa (No visa now)',
    description: 'Set up the entity first and add residency allocation whenever your timeline is ready.',
    fee: 0,
    image: investorVisaArtwork,
    ctaLabel: 'No Visa',
  },
  {
    id: 'employee-visa',
    name: 'Employee Visa',
    description: 'Add one professional residency allocation with onboarding document processing.',
    fee: 3850,
    image: employeeVisaArtwork,
    ctaLabel: 'Choose Employee Visa',
  },
  {
    id: 'dependent-visa',
    name: 'Dependent Visa',
    description: 'Support family sponsorship workflows and compliance setup for dependents.',
    fee: 2750,
    image: dependentVisaArtwork,
    ctaLabel: 'Choose Dependent Visa',
  },
]

export const addOnOptions: AddOnOption[] = [
  {
    id: 'bank-setup',
    groupId: 'mcore',
    name: 'Bank Account Enablement',
    description: 'Guided shortlist and account documentation support.',
    fee: 1850,
  },
  {
    id: 'business-center',
    groupId: 'mcore',
    name: 'Business Center Access',
    description: 'Flexible access to shared executive workspace facilities.',
    fee: 2200,
  },
  {
    id: 'document-priority',
    groupId: 'mcore',
    name: 'Priority Document Desk',
    description: 'Accelerated turnaround for legalization and attestations.',
    fee: 950,
  },
  {
    id: 'hr-assist',
    groupId: 'massist',
    name: 'HR Starter Kit',
    description: 'Onboarding templates, policy packs, and compliance checklists.',
    fee: 1250,
  },
  {
    id: 'meeting-room-pass',
    groupId: 'massist',
    name: 'Meeting Room Credits',
    description: 'Prepaid boardroom hours for investor and client meetings.',
    fee: 800,
  },
  {
    id: 'po-box',
    groupId: 'massist',
    name: 'PO Box Service',
    description: 'Dedicated postal handling with forwarding support.',
    fee: 640,
  },
  {
    id: 'bookkeeping-suite',
    groupId: 'maccounting',
    name: 'Bookkeeping Suite',
    description: 'Monthly ledger and expense categorization support.',
    fee: 2100,
  },
  {
    id: 'vat-registration',
    groupId: 'maccounting',
    name: 'VAT Registration',
    description: 'VAT application filing and authority response support.',
    fee: 1450,
  },
  {
    id: 'corporate-tax-assist',
    groupId: 'maccounting',
    name: 'Corporate Tax Assist',
    description: 'Readiness review and annual filing advisory package.',
    fee: 2300,
  },
  {
    id: 'audit-readiness',
    groupId: 'maccounting',
    name: 'Audit Readiness',
    description: 'Financial controls checklist and document preparation.',
    fee: 1700,
  },
  {
    id: 'payroll-basics',
    groupId: 'maccounting',
    name: 'Payroll Basics',
    description: 'Salary run templates and baseline payroll compliance setup.',
    fee: 1100,
  },
  {
    id: 'executive-support',
    groupId: 'massist',
    name: 'Executive Admin Support',
    description: 'Dedicated admin desk for founder task coordination.',
    fee: 1850,
  },
]

export const addOnGroups: AddOnGroup[] = [
  {
    id: 'mcore',
    name: 'mCore',
    description: 'Foundational setup boosters for fast launch readiness.',
    itemIds: ['bank-setup', 'business-center', 'document-priority'],
  },
  {
    id: 'massist',
    name: 'mAssist',
    description: 'Operational support services for daily business movement.',
    itemIds: ['hr-assist', 'meeting-room-pass', 'po-box', 'executive-support'],
  },
  {
    id: 'maccounting',
    name: 'mAccounting',
    description: 'Finance and tax management services that scale with your company.',
    itemIds: [
      'bookkeeping-suite',
      'vat-registration',
      'corporate-tax-assist',
      'audit-readiness',
      'payroll-basics',
    ],
  },
]

export const businessActivities: BusinessActivity[] = [
  { id: 'act-001', code: 'M-001', category: 'Technology', name: 'Software Development', description: 'Custom software products and maintenance services.', fee: 520 },
  { id: 'act-002', code: 'M-002', category: 'Technology', name: 'IT Consulting', description: 'Digital transformation and technical advisory consulting.', fee: 460 },
  { id: 'act-003', code: 'M-003', category: 'Technology', name: 'Cybersecurity Services', description: 'Security audits, response planning, and advisory operations.', fee: 590 },
  { id: 'act-004', code: 'M-004', category: 'Marketing', name: 'Digital Marketing Agency', description: 'Campaign planning and channel performance management.', fee: 470 },
  { id: 'act-005', code: 'M-005', category: 'Marketing', name: 'Content Production', description: 'Brand media production for digital and print campaigns.', fee: 430 },
  { id: 'act-006', code: 'M-006', category: 'Marketing', name: 'PR Consultancy', description: 'Press strategy, media outreach, and reputation management.', fee: 510 },
  { id: 'act-007', code: 'M-007', category: 'Retail', name: 'Online Retail Commerce', description: 'E-commerce operations and direct-to-consumer sales.', fee: 550 },
  { id: 'act-008', code: 'M-008', category: 'Retail', name: 'General Trading', description: 'Import/export and multi-category goods distribution.', fee: 600 },
  { id: 'act-009', code: 'M-009', category: 'Retail', name: 'Specialty Food Trading', description: 'Focused food product sourcing and distribution.', fee: 520 },
  { id: 'act-010', code: 'M-010', category: 'Consulting', name: 'Management Consultancy', description: 'Operational process and growth strategy advisory services.', fee: 530 },
  { id: 'act-011', code: 'M-011', category: 'Consulting', name: 'HR Consultancy', description: 'Talent operations and organizational development support.', fee: 420 },
  { id: 'act-012', code: 'M-012', category: 'Consulting', name: 'Training Services', description: 'Corporate learning programs and certification pathways.', fee: 410 },
  { id: 'act-013', code: 'M-013', category: 'Finance', name: 'Accounting Consultancy', description: 'Financial process and reporting advisory services.', fee: 540 },
  { id: 'act-014', code: 'M-014', category: 'Finance', name: 'Fintech Services', description: 'Payment innovation and digital finance solutions.', fee: 610 },
  { id: 'act-015', code: 'M-015', category: 'Finance', name: 'Investment Advisory', description: 'Portfolio structuring and market-entry guidance.', fee: 660 },
  { id: 'act-016', code: 'M-016', category: 'Operations', name: 'Logistics Coordination', description: 'Supply movement planning and vendor orchestration.', fee: 500 },
  { id: 'act-017', code: 'M-017', category: 'Operations', name: 'Procurement Services', description: 'Strategic sourcing and procurement process management.', fee: 480 },
  { id: 'act-018', code: 'M-018', category: 'Operations', name: 'Facility Management', description: 'Property operations and maintenance coordination.', fee: 570 },
  { id: 'act-019', code: 'M-019', category: 'Media', name: 'Video Production', description: 'Commercial, social, and corporate video creation.', fee: 450 },
  { id: 'act-020', code: 'M-020', category: 'Media', name: 'Photography Studio', description: 'Brand, product, and campaign photography services.', fee: 390 },
  { id: 'act-021', code: 'M-021', category: 'Media', name: 'Podcast Production', description: 'Audio planning, recording, and editing workflows.', fee: 360 },
  { id: 'act-022', code: 'M-022', category: 'Education', name: 'Online Coaching', description: 'Personal and professional coaching platform services.', fee: 370 },
  { id: 'act-023', code: 'M-023', category: 'Education', name: 'Corporate Workshops', description: 'Team workshops and specialized upskilling programs.', fee: 410 },
  { id: 'act-024', code: 'M-024', category: 'Education', name: 'Language Training', description: 'Language and communication training services.', fee: 340 },
  { id: 'act-025', code: 'M-025', category: 'Health', name: 'Wellness Consultancy', description: 'Corporate wellness strategy and implementation.', fee: 430 },
  { id: 'act-026', code: 'M-026', category: 'Health', name: 'Fitness Coaching Services', description: 'Individual and group coaching program operations.', fee: 390 },
  { id: 'act-027', code: 'M-027', category: 'Health', name: 'Nutrition Advisory', description: 'Diet planning and nutritional guidance services.', fee: 360 },
  { id: 'act-028', code: 'M-028', category: 'Design', name: 'Graphic Design Studio', description: 'Brand identity and visual communications design.', fee: 420 },
  { id: 'act-029', code: 'M-029', category: 'Design', name: 'Interior Design Consultancy', description: 'Commercial and residential design advisory projects.', fee: 580 },
  { id: 'act-030', code: 'M-030', category: 'Design', name: 'Product Design Services', description: 'Concept development and product design support.', fee: 500 },
]

export const pricingConfig: PricingConfig = {
  currency: 'AED',
  platformFee: 1300,
  extraShareholderFee: 950,
  durations: {
    1: 0,
    2: 1800,
    3: 3600,
    4: 5400,
    5: 7200,
    6: 9000,
  },
  activitySelectionLimit: 6,
  minimumActivities: 1,
}

export const defaultLeadForm: LeadFormData = {
  fullName: '',
  phone: '',
  email: '',
  consent: false,
}

export const defaultCalculatorState: CalculatorState = {
  leadForm: defaultLeadForm,
  selectedLicenseId: licenseOptions[0]?.id ?? null,
  durationYears: 1,
  shareholderCount: 1,
  selectedActivityIds: [],
  selectedVisaId: visaOptions[0]?.id ?? null,
  selectedAddOnIds: [],
}
