import heroBackgroundArtwork from '../assets/artwork/hero-bg.jpg'
import fawriLicenseArtwork from '../assets/artwork/b2c-fawri.webp'
import regularLicenseArtwork from '../assets/artwork/b2c-regular.webp'
import investorVisaArtwork from '../assets/artwork/investor-visa.webp'
import employeeVisaArtwork from '../assets/artwork/employee-visa.webp'
import dependentVisaArtwork from '../assets/artwork/depentent-visa.webp'
import changeStatusArtwork from '../assets/artwork/change-status.webp'
import type {
  AddOnGroup,
  AddOnOption,
  BusinessActivity,
  BusinessActivityCategory,
  CalculatorState,
  ChatWidgetCopy,
  FooterLinkGroup,
  HeaderNavSection,
  LeadFormData,
  LicenseOption,
  PricingConfig,
  VisaOption,
} from '../types/calculator'

export const heroImage = heroBackgroundArtwork
export const changeStatusImage = changeStatusArtwork

export const headerNavSections: HeaderNavSection[] = [
  {
    label: 'Setup a Company',
    items: ['Cost Calculator', 'Company Name Check', 'Business Activities', 'Refer a Friend'],
  },
  {
    label: 'G12 Plus',
    items: ['mPlus', 'mCore', 'mAccounting', 'mAssist', 'mResidency'],
  },
  {
    label: 'Eco System',
    items: ['Activity Hub', 'Case Studies', 'News & Partnerships'],
  },
  {
    label: 'Insights',
    items: ['Blogs', 'FAQs', 'Announcements'],
  },
  {
    label: 'Relocation',
  },
]

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    id: 'setup-company',
    title: 'Set up a Company',
    links: ['About Us', 'Cost Calculator', 'Company Name Check', 'Business Activities', 'Refer a Friend'],
  },
  {
    id: 'community',
    title: 'Community',
    links: ['Blogs', 'Activity Hub', 'Case Studies', 'Relocation to Dubai', 'News & Partnerships'],
  },
  {
    id: 'rules',
    title: 'Rules & Regulations',
    links: ['Regulations', 'Terms & Conditions', 'Referral Terms & Conditions', 'Cookie & Privacy Policy', 'Security Awareness'],
  },
  {
    id: 'G12-plus',
    title: 'G12 Plus',
    links: ['mPlus', 'mCore', 'mAccounting', 'mAssist', 'mResidency'],
  },
  {
    id: 'partners',
    title: 'Channel Partners',
    links: ['Become a Channel Partner', 'Channel Partner Portal', 'Our Partners'],
  },
  {
    id: 'compliance',
    title: 'Compliance',
    links: ['UBO', 'AML'],
  },
  {
    id: 'support',
    title: 'Support',
    links: ['FAQs', 'Announcements', 'News'],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    links: ['Connect with us', 'Location Map', 'Whistleblowing', 'Grievances and Feedback'],
  },
]

export const chatWidgetCopy: ChatWidgetCopy = {
  headline: "We're Online!",
  prompt: 'How may I help you today?',
}

export const licenseOptions: LicenseOption[] = [
  {
    id: 'fawri',
    name: 'Fawri License',
    timeline: 'In 60 Mins',
    tagline: 'Launch quickly',
    description:
      "Start fast with a solo-friendly instant license that's designed to evolve with your business.",
    features: ['Solo-friendly launch path', 'Digital onboarding', 'Visa-ready structure'],
    modalCopy: [
      'Fawri is designed for founders who want to get started fast without sacrificing credibility.',
      'It is ideal for independent operators, consultants, and lean teams who need a streamlined Dubai setup with room to grow later.',
    ],
    basePrice: 11500,
    image: fawriLicenseArtwork,
    selectLabel: 'Select Fawri License',
  },
  {
    id: 'regular',
    name: 'Regular Business License',
    timeline: '3-5 Days',
    tagline: 'Scale with flexibility',
    description:
      'A scalable license for startups and teams. Built for flexibility, partners, and long-term growth.',
    features: ['Multi-partner ready', 'Wider operating flexibility', 'Built for long-term growth'],
    modalCopy: [
      'The regular business license is built for founders who need flexibility, scalability, and full ownership.',
      'It supports multi-partner setups, broader operating models, and long-term expansion with a more tailored business presence in Dubai.',
    ],
    basePrice: 12500,
    image: regularLicenseArtwork,
    selectLabel: 'Select Regular License',
  },
]

export const visaOptions: VisaOption[] = [
  {
    id: 'investor-visa',
    name: 'Investor Visa',
    description: 'Live in the UAE as a business owner and manage your company.',
    fee: 3850,
    image: investorVisaArtwork,
    ctaLabel: 'Investor Visa',
    kind: 'toggle',
    modalCopy: [
      'The investor visa lets founders live in the UAE while managing their company locally.',
      'Choose this option when the company owner needs residency support tied to the selected business setup.',
    ],
  },
  {
    id: 'employee-visa',
    name: 'Employee Visa',
    description: 'Sponsor team members under your company license.',
    fee: 3250,
    image: employeeVisaArtwork,
    ctaLabel: 'Select',
    kind: 'counter',
    modalCopy: [
      'Employee visas cover sponsored team members who will work under the company license.',
      'Use the counter to reflect how many employee visas should be included in the estimate.',
    ],
  },
  {
    id: 'dependent-visa',
    name: 'Dependent Visa',
    description: 'Bring your spouse, children, or parents to live with you.',
    fee: 2750,
    image: dependentVisaArtwork,
    ctaLabel: 'Select',
    kind: 'counter',
    modalCopy: [
      'Dependent visas support family members joining the primary applicant in the UAE.',
      'Use this option when the estimate should include spouse, child, or parent sponsorship costs.',
    ],
  },
]

export const addOnOptions: AddOnOption[] = [
  {
    id: 'bank-account',
    groupId: 'mcore',
    name: 'Bank Account',
    description: 'Guided bank account setup support with document preparation.',
    fee: 1800,
  },
  {
    id: 'business-card',
    groupId: 'mcore',
    name: 'Business Card',
    description: 'Premium business card design and production.',
    fee: 350,
  },
  {
    id: 'company-stamp',
    groupId: 'mcore',
    name: 'Company Stamp',
    description: 'Official company stamp production and delivery.',
    fee: 220,
  },
  {
    id: 'ecommerce-starter',
    groupId: 'mcore',
    name: 'E-commerce Starter',
    description: 'Starter support for online selling operations.',
    fee: 1450,
  },
  {
    id: 'medical-emirates-id',
    groupId: 'mresidency',
    name: 'Medical & Emirates ID',
    description: 'Residency medical test and Emirates ID support.',
    fee: 1280,
  },
  {
    id: 'medical-insurance',
    groupId: 'mresidency',
    name: 'Medical Insurance',
    description: 'Entry-level medical insurance guidance.',
    fee: 980,
  },
  {
    id: 'melite',
    groupId: 'massist',
    name: 'mElite',
    description: 'Priority founder support for documents and admin tasks.',
    fee: 2400,
  },
  {
    id: 'meeting-rooms',
    groupId: 'massist',
    name: 'Meeting Rooms',
    description: 'Boardroom credits for meetings and client sessions.',
    fee: 650,
  },
  {
    id: 'po-box',
    groupId: 'massist',
    name: 'PO Box',
    description: 'Dedicated mail handling and forwarding.',
    fee: 540,
  },
  {
    id: 'document-translation',
    groupId: 'massist',
    name: 'Document Translation',
    description: 'Translation support for licensing and residency paperwork.',
    fee: 720,
  },
  {
    id: 'mail-management',
    groupId: 'massist',
    name: 'Mail Management',
    description: 'Mail screening and routing support.',
    fee: 460,
  },
  {
    id: 'virtual-assistant',
    groupId: 'massist',
    name: 'Virtual Assistant',
    description: 'Remote admin support for founder schedules and follow-ups.',
    fee: 1650,
  },
  {
    id: 'corporate-tax',
    groupId: 'maccounting',
    name: 'Corporate Tax',
    description: 'Corporate tax registration and readiness support.',
    fee: 1650,
    recommended: true,
  },
  {
    id: 'vat-registration',
    groupId: 'maccounting',
    name: 'VAT Registration',
    description: 'VAT filing setup and authority response support.',
    fee: 1450,
    recommended: true,
  },
  {
    id: 'bookkeeping',
    groupId: 'maccounting',
    name: 'Bookkeeping',
    description: 'Monthly bookkeeping and reporting support.',
    fee: 2100,
  },
  {
    id: 'liquidation-report',
    groupId: 'maccounting',
    name: 'Liquidation Report',
    description: 'Closure support with liquidation reporting.',
    fee: 1750,
  },
  {
    id: 'financial-audit-report',
    groupId: 'maccounting',
    name: 'Financial Audit Report',
    description: 'Audit coordination and reporting support.',
    fee: 2600,
  },
  {
    id: 'valuation-report',
    groupId: 'maccounting',
    name: 'Valuation Report',
    description: 'Business valuation report preparation.',
    fee: 1950,
  },
]

export const addOnGroups: AddOnGroup[] = [
  {
    id: 'mcore',
    name: 'mCore',
    description: 'Essential tools to kickstart your business with ease, from banking to branding.',
    modalCopy: [
      'mCore brings together the practical launch services founders usually need first.',
      'It covers foundational setup support such as banking, identity materials, and e-commerce readiness.',
    ],
    itemIds: ['bank-account', 'business-card', 'company-stamp', 'ecommerce-starter'],
  },
  {
    id: 'mresidency',
    name: 'mResidency',
    description: 'Simplified residency services for you, your employees, or your family.',
    modalCopy: [
      'mResidency focuses on the post-license steps needed to complete residency formalities smoothly.',
      'It is useful for founders who want one place to estimate medical, ID, and insurance support.',
    ],
    itemIds: ['medical-emirates-id', 'medical-insurance'],
  },
  {
    id: 'massist',
    name: 'mAssist',
    description: 'A full range of tools and administration support built for smooth, hassle-free operation.',
    modalCopy: [
      'mAssist adds operational support services that help teams stay lean while keeping daily admin under control.',
      'It bundles practical support like meeting space, translations, mail handling, and executive assistance.',
    ],
    itemIds: ['melite', 'meeting-rooms', 'po-box', 'document-translation', 'mail-management', 'virtual-assistant'],
  },
  {
    id: 'maccounting',
    name: 'mAccounting',
    description: 'Full-service tax, audit, and bookkeeping to keep your finances compliant.',
    modalCopy: [
      'mAccounting covers the compliance-heavy finance services founders typically need after incorporation.',
      'It is intended for businesses that want bookkeeping, tax registration, and reporting support included in their setup plan.',
    ],
    itemIds: ['corporate-tax', 'vat-registration', 'bookkeeping', 'liquidation-report', 'financial-audit-report', 'valuation-report'],
  },
]

const activityCategoryArtwork = [
  fawriLicenseArtwork,
  regularLicenseArtwork,
  investorVisaArtwork,
  employeeVisaArtwork,
  dependentVisaArtwork,
  heroImage,
]

export const activityCategories: BusinessActivityCategory[] = [
  { id: 'fb-rentals', name: 'F&B, Rentals', badge: 'FR', description: 'Hospitality, food service, leasing, and short-stay operations.', accent: '#ead7bd' },
  { id: 'financial', name: 'Financial', badge: 'FI', description: 'Accounting, advisory, fintech, and financial support services.', accent: '#dbe8f4' },
  { id: 'education', name: 'Education', badge: 'ED', description: 'Training, coaching, workshops, and education-related activities.', accent: '#f2ddd1' },
  { id: 'transportation', name: 'Transportation', badge: 'TR', description: 'Logistics, fleet support, freight, and transport coordination.', accent: '#dce2f1' },
  { id: 'maintenance', name: 'Maintenance', badge: 'MA', description: 'Repair, upkeep, cleaning, and maintenance services.', accent: '#e2e7d6' },
  { id: 'real-estate', name: 'Real Estate', badge: 'RE', description: 'Property consulting, brokerage support, and real estate services.', accent: '#eedfd6' },
  { id: 'administrative', name: 'Administrative', badge: 'AD', description: 'Office support, outsourcing, and business administration.', accent: '#e5dff0' },
  { id: 'agriculture', name: 'Agriculture', badge: 'AG', description: 'Agri services, landscaping, and related support activities.', accent: '#dfe9dd' },
  { id: 'art', name: 'Art', badge: 'AR', description: 'Creative production, fine arts, events, and cultural services.', accent: '#f6dde2' },
  { id: 'ict', name: 'ICT', badge: 'IT', description: 'Software, digital infrastructure, cybersecurity, and IT support.', accent: '#d9ecef' },
  { id: 'health-care', name: 'Health Care', badge: 'HC', description: 'Wellness, health advisory, and medical support services.', accent: '#e7efe6' },
  { id: 'services', name: 'Services', badge: 'SE', description: 'General service businesses across consumer and commercial verticals.', accent: '#f3e7d8' },
  { id: 'professional', name: 'Professional', badge: 'PR', description: 'Specialist consultancies and professional advisory services.', accent: '#dde2ef' },
  { id: 'sewerage', name: 'Sewerage', badge: 'SW', description: 'Wastewater and sanitary system related support activities.', accent: '#d9e5ed' },
  { id: 'trading', name: 'Trading', badge: 'TD', description: 'General and specialized trading across goods categories.', accent: '#f0dfca' },
  { id: 'waste-collection', name: 'Waste Collection', badge: 'WC', description: 'Collection, recycling, and environmental support operations.', accent: '#dfe9e0' },
  { id: 'manufacturing', name: 'Manufacturing', badge: 'MN', description: 'Light manufacturing, assembly, and production support.', accent: '#e7dfdb' },
].map((category, index) => ({
  ...category,
  image: activityCategoryArtwork[index % activityCategoryArtwork.length],
}))

function createActivities(
  categoryId: string,
  category: string,
  items: Array<{ code: string; name: string; preApproval?: boolean }>,
): BusinessActivity[] {
  return items.map((item) => ({
    id: `${categoryId}-${item.code.toLowerCase().replace(/\./g, '-')}`,
    code: item.code,
    categoryId,
    category,
    name: item.name,
    description: `${item.name} under the ${category} activity group.`,
    preApproval: item.preApproval,
  }))
}

export const businessActivities: BusinessActivity[] = [
  ...createActivities('fb-rentals', 'F&B, Rentals', [
    { code: '5510.00', name: 'Short Term Accommodation Activities' },
    { code: '5510.91', name: 'Hotel', preApproval: true },
    { code: '5510.92', name: 'Guest House', preApproval: true },
    { code: '5610.01', name: 'Restaurants' },
    { code: '5610.02', name: 'Cafeterias' },
    { code: '5630.99', name: 'Coffee Shop' },
  ]),
  ...createActivities('financial', 'Financial', [
    { code: '6419.10', name: 'Financial Advisory Services' },
    { code: '6499.21', name: 'Fintech Enablement Services' },
    { code: '6920.10', name: 'Accounting Consultancy' },
  ]),
  ...createActivities('education', 'Education', [
    { code: '8549.11', name: 'Corporate Workshops' },
    { code: '8551.10', name: 'Online Coaching' },
    { code: '8559.20', name: 'Language Training' },
  ]),
  ...createActivities('transportation', 'Transportation', [
    { code: '5229.10', name: 'Logistics Coordination' },
    { code: '4930.20', name: 'Fleet Dispatch Support' },
    { code: '5320.10', name: 'Courier Operations Support' },
  ]),
  ...createActivities('maintenance', 'Maintenance', [
    { code: '8121.10', name: 'Commercial Cleaning Services' },
    { code: '4321.20', name: 'Electrical Maintenance' },
    { code: '4330.10', name: 'Property Upkeep Services' },
  ]),
  ...createActivities('real-estate', 'Real Estate', [
    { code: '6831.10', name: 'Real Estate Brokerage Support' },
    { code: '6820.30', name: 'Property Leasing Consultancy' },
    { code: '7110.40', name: 'Real Estate Advisory' },
  ]),
  ...createActivities('administrative', 'Administrative', [
    { code: '8211.10', name: 'Document Processing Services' },
    { code: '8299.20', name: 'Back Office Support' },
    { code: '7830.10', name: 'Recruitment Support Services' },
  ]),
  ...createActivities('agriculture', 'Agriculture', [
    { code: '8130.10', name: 'Landscape Services' },
    { code: '0161.20', name: 'Agricultural Support Services' },
    { code: '4620.10', name: 'Agri Trading Support' },
  ]),
  ...createActivities('art', 'Art', [
    { code: '9000.10', name: 'Art Gallery Operations' },
    { code: '7410.20', name: 'Creative Studio Services' },
    { code: '9000.30', name: 'Live Event Creative Production' },
  ]),
  ...createActivities('ict', 'ICT', [
    { code: '6201.10', name: 'Software Development' },
    { code: '6202.20', name: 'IT Consulting' },
    { code: '6209.40', name: 'Cybersecurity Services' },
  ]),
  ...createActivities('health-care', 'Health Care', [
    { code: '8690.10', name: 'Wellness Consultancy' },
    { code: '8690.20', name: 'Nutrition Advisory' },
    { code: '9319.40', name: 'Fitness Coaching Services' },
  ]),
  ...createActivities('services', 'Services', [
    { code: '7020.20', name: 'Management Consultancy' },
    { code: '7310.10', name: 'Digital Marketing Agency' },
    { code: '8230.10', name: 'Event Management Support' },
  ]),
  ...createActivities('professional', 'Professional', [
    { code: '7410.10', name: 'Graphic Design Studio' },
    { code: '7110.10', name: 'Interior Design Consultancy' },
    { code: '7020.40', name: 'HR Consultancy' },
  ]),
  ...createActivities('sewerage', 'Sewerage', [
    { code: '3700.10', name: 'Wastewater Management Support' },
    { code: '3700.20', name: 'Drainage Maintenance Consultancy' },
    { code: '3811.30', name: 'Sanitary Collection Planning' },
  ]),
  ...createActivities('trading', 'Trading', [
    { code: '4690.10', name: 'General Trading' },
    { code: '4630.20', name: 'Specialty Food Trading' },
    { code: '4651.10', name: 'Technology Trading' },
  ]),
  ...createActivities('waste-collection', 'Waste Collection', [
    { code: '3811.10', name: 'General Waste Collection' },
    { code: '3830.20', name: 'Recycling Collection Services' },
    { code: '3900.10', name: 'Environmental Cleanup Support' },
  ]),
  ...createActivities('manufacturing', 'Manufacturing', [
    { code: '2599.10', name: 'Light Assembly Services' },
    { code: '3290.20', name: 'Product Finishing Support' },
    { code: '1071.10', name: 'Food Production Support', preApproval: true },
  ]),
]

export const pricingConfig: PricingConfig = {
  currency: 'AED',
  extraShareholderFee: 2000,
  includedShareholders: 6,
  durations: {
    1: 0,
    2: 11000,
    3: 20750,
    4: 30000,
    5: 38750,
    6: 47000,
  },
  includedActivityCount: 3,
  extraActivityFee: 1000,
  minimumActivities: 1,
  immigrationCardFee: 2000,
  changeStatusInsideFee: 1250,
}

export const defaultLeadForm: LeadFormData = {
  fullName: '',
  phone: '',
  email: '',
  consent: false,
}

export const defaultCalculatorState: CalculatorState = {
  leadForm: defaultLeadForm,
  selectedLicenseId: null,
  durationYears: 1,
  shareholderCount: 1,
  selectedActivityIds: [],
  selectedAddOnIds: [],
  investorVisaEnabled: false,
  employeeVisaCount: 0,
  dependentVisaCount: 0,
  applicantsInsideUae: 0,
}
