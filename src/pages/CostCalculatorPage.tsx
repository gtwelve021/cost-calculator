
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { AnimatedSection } from '../components/AnimatedSection'
import {
  addOnGroups,
  addOnOptions,
  businessActivities,
  defaultCalculatorState,
  defaultLeadForm,
  heroImage,
  licenseOptions,
  pricingConfig,
  visaOptions,
} from '../config/calculatorConfig'
import type { CalculatorState, LeadFormData } from '../types/calculator'
import { calculateQuote } from '../utils/calculations'
import { cn } from '../utils/cn'
import { formatAed } from '../utils/currency'
import { getSubmissionIssues, isLeadFormComplete } from '../utils/gating'
import { CALCULATOR_STATE_KEY, loadCalculatorState, saveCalculatorState } from '../utils/persistence'

const BRAND_LOGO_URL = 'https://g12.ae/wp-content/uploads/2024/12/G12-Final-Logo-Update-01.svg'

const leadFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required.'),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?\d[\d\s()-]{7,20}$/, 'Enter a valid phone number.'),
  email: z.string().trim().email('Enter a valid email address.'),
  consent: z.boolean().refine((value) => value, {
    message: 'This consent is required to continue.',
  }),
})

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  )
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-[1.45rem] font-semibold leading-tight text-ink md:text-[1.7rem]">{title}</h2>
      <p className="text-sm text-slate-500 md:text-[0.96rem]">{subtitle}</p>
    </div>
  )
}

export function CostCalculatorPage() {
  const persistedState = useMemo(() => loadCalculatorState(), [])
  const initialState = persistedState ?? defaultCalculatorState

  const {
    control,
    formState: { errors },
    register,
    reset,
    trigger,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onChange',
    defaultValues: initialState.leadForm,
  })

  const watchedLead = useWatch({ control })

  const leadForm: LeadFormData = useMemo(
    () => ({
      fullName: watchedLead.fullName ?? '',
      phone: watchedLead.phone ?? '',
      email: watchedLead.email ?? '',
      consent: watchedLead.consent ?? false,
    }),
    [watchedLead.consent, watchedLead.email, watchedLead.fullName, watchedLead.phone],
  )

  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(initialState.selectedLicenseId)
  const [durationYears, setDurationYears] = useState<number>(initialState.durationYears)
  const [shareholderCount, setShareholderCount] = useState<number>(initialState.shareholderCount)
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>(initialState.selectedActivityIds)
  const [selectedVisaId, setSelectedVisaId] = useState<string | null>(initialState.selectedVisaId)
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>(initialState.selectedAddOnIds)
  const [activityQuery, setActivityQuery] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [quoteStarted, setQuoteStarted] = useState(() => isLeadFormComplete(initialState.leadForm))

  const licenseSectionRef = useRef<HTMLElement | null>(null)

  const state: CalculatorState = useMemo(
    () => ({
      leadForm,
      selectedLicenseId,
      durationYears,
      shareholderCount,
      selectedActivityIds,
      selectedVisaId,
      selectedAddOnIds,
    }),
    [
      durationYears,
      leadForm,
      selectedActivityIds,
      selectedAddOnIds,
      selectedLicenseId,
      selectedVisaId,
      shareholderCount,
    ],
  )

  useEffect(() => {
    saveCalculatorState(state)
  }, [state])

  const quote = useMemo(() => {
    return calculateQuote(state, pricingConfig, {
      licenses: licenseOptions,
      activities: businessActivities,
      visas: visaOptions,
      addOns: addOnOptions,
    })
  }, [state])

  const leadReady = isLeadFormComplete(leadForm)
  const calculatorUnlocked = quoteStarted && leadReady
  const companySetupTotal = quote.licenseBase + quote.durationDelta + quote.shareholderDelta

  const submissionIssues = useMemo(() => {
    return getSubmissionIssues(state, pricingConfig.minimumActivities)
  }, [state])

  const selectedLicense = licenseOptions.find((item) => item.id === selectedLicenseId)
  const selectedVisa = visaOptions.find((item) => item.id === selectedVisaId)

  const estimateId = useMemo(() => {
    const licensePrefix = selectedLicense?.name.slice(0, 2).toUpperCase() ?? 'NA'
    return `EST-${licensePrefix}-${Math.round(quote.total).toString().padStart(5, '0')}`
  }, [quote.total, selectedLicense?.name])

  const filteredActivities = useMemo(() => {
    const query = activityQuery.trim().toLowerCase()

    if (!query) {
      return businessActivities
    }

    return businessActivities.filter((activity) => {
      return [activity.name, activity.category, activity.code, activity.description]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [activityQuery])

  const toggleActivity = (id: string) => {
    setSelectedActivityIds((current) => {
      const isSelected = current.includes(id)

      if (isSelected) {
        return current.filter((activityId) => activityId !== id)
      }

      if (current.length >= pricingConfig.activitySelectionLimit) {
        return current
      }

      return [...current, id]
    })
  }

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds((current) => {
      if (current.includes(id)) {
        return current.filter((addOnId) => addOnId !== id)
      }

      return [...current, id]
    })
  }

  const handleContinue = async () => {
    const valid = await trigger()

    if (!valid) {
      return
    }

    setQuoteStarted(true)
    licenseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleReset = () => {
    reset(defaultLeadForm)
    setSelectedLicenseId(defaultCalculatorState.selectedLicenseId)
    setDurationYears(defaultCalculatorState.durationYears)
    setShareholderCount(defaultCalculatorState.shareholderCount)
    setSelectedActivityIds(defaultCalculatorState.selectedActivityIds)
    setSelectedVisaId(defaultCalculatorState.selectedVisaId)
    setSelectedAddOnIds(defaultCalculatorState.selectedAddOnIds)
    setActivityQuery('')
    setSubmitAttempted(false)
    setShowSuccess(false)
    setQuoteStarted(false)
    window.localStorage.removeItem(CALCULATOR_STATE_KEY)
  }

  const handleConfirm = async () => {
    const leadValid = await trigger()
    setSubmitAttempted(true)

    if (leadValid && submissionIssues.length === 0) {
      setShowSuccess(true)
    }
  }

  return (
    <main className="pb-20">
      <AnimatedSection className="mx-auto max-w-[1200px] px-4 pb-12 pt-12 md:px-8 md:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="max-w-[510px] space-y-6">
            <div className="space-y-4">
              <img
                src={BRAND_LOGO_URL}
                alt="G12 logo"
                className="h-11 w-auto md:h-12"
                loading="lazy"
              />
              <p className="inline-flex items-center gap-2 rounded-full border border-[#e1d0b0] bg-[#fbf6eb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ab8134]">
                <ShieldCheck size={14} />
                Smart Setup Assistant
              </p>
              <h1 className="text-[2.1rem] leading-tight md:text-[3.25rem]">
                Business Setup
                <span className="block text-[#ab8134]">Cost Calculator</span>
              </h1>
              <p className="max-w-[470px] text-[1.05rem] font-semibold text-[#171d29]">
                Estimate your business launch cost with clear pricing logic across licenses, activities,
                visas, and operational add-ons.
              </p>
              <p className="max-w-[470px] text-sm leading-relaxed text-slate-600 md:text-[0.98rem]">
                This interactive estimator gives a transparent cost breakdown with real-time updates. No
                vague ranges, no hidden conditions, just a practical quote you can use to plan your next
                move.
              </p>
            </div>
          </div>

          <motion.figure
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[500px]"
          >
            <img
              src={heroImage}
              alt="Professional using tablet"
              className="relative z-10 w-full"
            />
            
          </motion.figure>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-[1200px] px-4 md:px-8" delay={0.08}>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <article className="rounded-3xl border border-[#e9dfcc] bg-[#fffbf5]/95 p-6 shadow-soft md:p-8">
            <SectionHeading
              title="Tell Us a Few Details to Get Started"
              subtitle="The more we know about your setup intent, the more accurate your estimate becomes."
            />

            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-sm font-semibold text-[#30394b]">
                  Enter your full name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  {...register('fullName')}
                  className={cn(
                    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4 focus:ring-[#f3e7cf]',
                    errors.fullName ? 'border-[#df7583]' : 'border-[#e3d8c5] focus:border-[#d6a456]',
                  )}
                />
                {errors.fullName && <p className="text-xs text-[#cf4b5c]">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-semibold text-[#30394b]">
                  Enter phone number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  {...register('phone')}
                  className={cn(
                    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4 focus:ring-[#f3e7cf]',
                    errors.phone ? 'border-[#df7583]' : 'border-[#e3d8c5] focus:border-[#d6a456]',
                  )}
                />
                {errors.phone && <p className="text-xs text-[#cf4b5c]">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-[#30394b]">
                  Enter email address *
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                  className={cn(
                    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4 focus:ring-[#f3e7cf]',
                    errors.email ? 'border-[#df7583]' : 'border-[#e3d8c5] focus:border-[#d6a456]',
                  )}
                />
                {errors.email && <p className="text-xs text-[#cf4b5c]">{errors.email.message}</p>}
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-[#e9dfcc] bg-white px-3.5 py-3 text-xs leading-relaxed text-slate-600">
                <input
                  type="checkbox"
                  {...register('consent')}
                  className="mt-0.5 h-4 w-4 rounded border-[#bdc8db]"
                  aria-label="I have read and understood the terms and privacy policy"
                />
                <span>
                  I have read and understood the terms and privacy policy. I consent to communication by
                  email, phone, or WhatsApp regarding my setup request.
                </span>
              </label>
              {errors.consent && <p className="text-xs text-[#cf4b5c]">{errors.consent.message}</p>}

              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center gap-2 rounded-full bg-[#d6a456] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ab8134]"
              >
                Calculate
                <ArrowRight size={16} />
              </button>

              <p
                className={cn(
                  'rounded-xl border px-3.5 py-2 text-xs',
                  calculatorUnlocked
                    ? 'border-[#b6e2c8] bg-[#e9f9f0] text-[#2f7f4e]'
                    : leadReady
                      ? 'border-[#efe4cf] bg-[#fbf4e8] text-[#ab8134]'
                    : 'border-[#efe6d4] bg-[#faf5ec] text-slate-500',
                )}
              >
                {calculatorUnlocked
                  ? 'Quote unlocked. You can now review options and build your estimate.'
                  : leadReady
                    ? 'Details look good. Press Calculate to unlock your live quote.'
                  : 'Complete this required step to unlock your full business setup estimate.'}
              </p>
            </div>
          </article>

          <aside className="rounded-3xl border border-[#e4d9c6] bg-white p-5 shadow-soft lg:sticky lg:top-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8e7137]">
                {calculatorUnlocked ? 'Live Estimate' : 'Quote Status'}
              </p>
              <h2 className="text-[1.35rem] font-semibold">
                {calculatorUnlocked ? 'Your Business Setup Estimate' : 'Your Custom Quote Awaits'}
              </h2>
              <p className="text-sm text-slate-500">
                {calculatorUnlocked
                  ? 'Your selections now update a grouped estimate in real time.'
                  : 'Start filling out the form to unlock your personalized pricing breakdown.'}
              </p>
            </div>

            {!calculatorUnlocked ? (
              <div className="mt-5 rounded-[2rem] border border-[#e9dfcc] bg-[linear-gradient(180deg,#fffaf2_0%,#f7efe0_100%)] p-4">
                <div className="flex min-h-[330px] items-center justify-center rounded-[1.6rem] border border-white/80 bg-white/60 px-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur">
                  <div className="max-w-[260px] space-y-3">
                    <p className="text-base font-semibold text-[#7f642d]">Your Custom Quote Awaits</p>
                    <p className="text-sm leading-relaxed text-slate-500">
                      Start filling out the form to see your personalized pricing breakdown and live total.
                    </p>
                  </div>
                </div>
                <p className="mt-4 rounded-2xl border border-[#efe4cf] bg-[#fffaf2] px-3.5 py-2 text-xs text-slate-500">
                  Complete the required contact step and press Calculate to unlock the full estimator.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-[#e9dfcc] bg-[#fef9f2] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7137]">
                      Company Setup
                    </p>
                    <div className="mt-3 space-y-2.5">
                      <QuoteRow label="License Type" value={selectedLicense?.name ?? 'Not selected'} />
                      <QuoteRow
                        label="License Duration"
                        value={`${durationYears} year${durationYears > 1 ? 's' : ''}`}
                      />
                      <QuoteRow label="Shareholders" value={`${shareholderCount}`} />
                      <QuoteRow label="Total Cost" value={formatAed(companySetupTotal)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e9dfcc] bg-[#fffdf8] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7137]">
                      Business Activities
                    </p>
                    <div className="mt-3 space-y-2.5">
                      <QuoteRow label="Selected Activities" value={`${selectedActivityIds.length}`} />
                      <QuoteRow label="Activity Cost" value={formatAed(quote.activitiesTotal)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e9dfcc] bg-[#fffdf8] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7137]">
                      Visa Selection
                    </p>
                    <div className="mt-3 space-y-2.5">
                      <QuoteRow label="Visa Type" value={selectedVisa?.name ?? 'Not selected'} />
                      <QuoteRow label="Visa Cost" value={formatAed(quote.visaTotal)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e9dfcc] bg-[#fffdf8] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7137]">
                      Additional Services
                    </p>
                    <div className="mt-3 space-y-2.5">
                      <QuoteRow label="Selected Add-ons" value={`${selectedAddOnIds.length}`} />
                      <QuoteRow label="Service Cost" value={formatAed(quote.addOnsTotal)} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.8rem] border border-[#dfd2bc] bg-[linear-gradient(180deg,#e9dcc5_0%,#dcc7a1_100%)] p-4">
                  <div className="rounded-[1.4rem] bg-white/80 p-4 backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8e7137]">
                          Grand Total
                        </p>
                        <strong className="mt-1 block text-[1.45rem] text-[#7f642d]">
                          {formatAed(quote.total)}
                        </strong>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>Platform fee</p>
                        <p className="mt-1 font-semibold text-[#7f642d]">{formatAed(quote.platformFee)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <button
                        type="button"
                        onClick={handleConfirm}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#7f642d] transition hover:bg-[#fff8ec]"
                        aria-label="Get instant quote"
                      >
                        Get Instant Quote
                        <ArrowRight size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#5c513d] transition hover:border-white"
                      >
                        <RotateCcw size={15} />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {submitAttempted && submissionIssues.length > 0 && (
              <div className="mt-4 rounded-xl border border-[#f0ced4] bg-[#fff4f6] px-3.5 py-3">
                <p className="text-xs font-semibold text-[#c54656]">Complete these items before confirming:</p>
                <ul className="mt-1.5 space-y-1 text-xs text-[#9f3f4a]">
                  {submissionIssues.map((issue) => (
                    <li key={issue}>- {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </AnimatedSection>

      <div className="mt-10 space-y-8">
        {!calculatorUnlocked ? (
          <AnimatedSection className="mx-auto max-w-[1200px] px-4 md:px-8" delay={0.12}>
            <div className="rounded-[2rem] border border-[#ece2cf] bg-[linear-gradient(180deg,#fffaf2_0%,#f7efe0_100%)] p-6 shadow-soft md:p-8">
              <div className="max-w-[720px] space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e7137]">
                  Calculator Locked
                </p>
                <h2 className="text-[1.6rem] font-semibold text-[#171d29]">
                  Complete the lead form, then press Calculate to unlock the full estimator
                </h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  License cards, activity selection, visa choices, add-ons, and the live quote breakdown
                  will appear after the initial form step is confirmed.
                </p>
              </div>
            </div>
          </AnimatedSection>
        ) : (
          <>
        <AnimatedSection
          className="mx-auto max-w-[1200px] px-4 md:px-8"
          delay={0.12}
          id="licenses"
        >
          <section ref={licenseSectionRef}>
            <SectionHeading
              title="Pick From Two Powerful License Options"
              subtitle="Choose the structure that best fits your launch timeline and operating model."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {licenseOptions.map((option, index) => {
                const selected = option.id === selectedLicenseId

                return (
                  <motion.article
                    key={option.id}
                    whileHover={leadReady ? { y: -4, scale: 1.01 } : undefined}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-white shadow-soft transition',
                      selected ? 'border-[#d6a456]' : 'border-[#e8decb]',
                      !leadReady && 'pointer-events-none',
                    )}
                  >
                    <img
                      src={option.image}
                      alt={option.name}
                      className="h-44 w-full border-b border-[#e8decb] object-cover"
                    />
                    <div className="space-y-3 p-4">
                      <div>
                        <h3 className="text-lg font-semibold">{option.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{option.tagline}</p>
                      </div>
                      <p className="text-sm text-slate-600">{option.description}</p>
                      <ul className="space-y-1 text-xs text-[#425069]">
                        {option.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check size={14} className="mt-0.5 text-[#ab8134]" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm font-semibold text-[#ab8134]">Starts {formatAed(option.basePrice)}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedLicenseId(option.id)}
                          className={cn(
                            'rounded-full px-4 py-2 text-xs font-semibold transition',
                            selected
                              ? 'bg-[#10131a] text-white'
                              : 'border border-[#e4d9c6] bg-white text-[#34435d] hover:border-[#c8b48b]',
                          )}
                          aria-label={`Select ${option.name}`}
                        >
                          {selected ? 'Selected' : index === 0 ? 'Select Launch License' : 'Select Growth License'}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection className="mx-auto max-w-[1200px] px-4 md:px-8" delay={0.16}>
          <section
            className={cn(
              'rounded-3xl border border-[#e8decb] bg-white p-5 shadow-soft md:p-6',
              !leadReady && 'pointer-events-none',
            )}
          >
            <SectionHeading
              title="Tune Duration and Shareholders"
              subtitle="Adjust your setup horizon and ownership structure to see the exact cost impact."
            />

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#314058]">Duration of Business License</h3>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((years) => (
                    <button
                      key={years}
                      type="button"
                      onClick={() => setDurationYears(years)}
                      className={cn(
                        'min-w-11 rounded-full px-3 py-1.5 text-sm font-semibold transition',
                        durationYears === years
                          ? 'bg-[#10131a] text-white'
                          : 'border border-[#e7dece] bg-[#fef9f2] text-[#374560] hover:border-[#c8b48b]',
                      )}
                    >
                      {years}Y
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Longer durations reduce annual renewal pressure and improve planning certainty.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#314058]">Number of Shareholders</h3>
                <div className="inline-flex items-center gap-3 rounded-full border border-[#e7dece] bg-[#fef9f2] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setShareholderCount((value) => Math.max(1, value - 1))}
                    className="rounded-full border border-[#c8d2e2] p-1.5 text-[#314058]"
                    aria-label="Decrease shareholder count"
                  >
                    <Minus size={14} />
                  </button>
                  <strong className="min-w-8 text-center text-lg">{shareholderCount}</strong>
                  <button
                    type="button"
                    onClick={() => setShareholderCount((value) => Math.min(6, value + 1))}
                    className="rounded-full border border-[#c8d2e2] p-1.5 text-[#314058]"
                    aria-label="Increase shareholder count"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Each additional shareholder adds compliance and documentation handling fees.
                </p>
              </div>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection className="mx-auto max-w-[1200px] px-4 md:px-8" delay={0.2}>
          <section
            className={cn(
              'rounded-3xl border border-[#e8decb] bg-white p-5 shadow-soft md:p-6',
              !leadReady && 'pointer-events-none',
            )}
          >
            <SectionHeading
              title="Select Your Business Activities"
              subtitle={`Choose up to ${pricingConfig.activitySelectionLimit} activities. Search by name, category, or code.`}
            />
            <div className="mt-4 rounded-xl border border-[#efe4cf] bg-[#fbf4e8] px-3 py-2 text-xs text-[#ab8134]">
              Selected {selectedActivityIds.length}/{pricingConfig.activitySelectionLimit}
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-xl border border-[#e9dfcb] bg-[#fef9f2] px-3 py-2 text-slate-500">
              <Search size={16} />
              <input
                value={activityQuery}
                onChange={(event) => setActivityQuery(event.target.value)}
                placeholder="Search business activity"
                className="w-full border-none bg-transparent text-sm outline-none"
                aria-label="Search business activity"
              />
            </label>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.slice(0, 30).map((activity) => {
                const selected = selectedActivityIds.includes(activity.id)
                const limitReached =
                  !selected && selectedActivityIds.length >= pricingConfig.activitySelectionLimit

                return (
                  <motion.article
                    key={activity.id}
                    whileHover={leadReady ? { y: -3 } : undefined}
                    className={cn(
                      'rounded-2xl border p-3.5 transition',
                      selected ? 'border-[#d6a456] bg-[#fbf4e8]' : 'border-[#e8decb] bg-white',
                    )}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e7137]">{activity.code}</p>
                    <h3 className="mt-1 text-sm font-semibold text-[#1b2537]">{activity.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{activity.category}</p>
                    <p className="mt-2 min-h-12 text-xs text-slate-600">{activity.description}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#ab8134]">{formatAed(activity.fee)}</span>
                      <button
                        type="button"
                        onClick={() => toggleActivity(activity.id)}
                        disabled={limitReached}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                          selected
                            ? 'bg-[#10131a] text-white'
                            : 'border border-[#e4d9c6] bg-white text-[#33435d] hover:border-[#c8b48b]',
                          limitReached && 'cursor-not-allowed opacity-45',
                        )}
                        aria-label={selected ? `Remove ${activity.name}` : `Add ${activity.name}`}
                      >
                        {selected ? 'Added' : 'Add'}
                      </button>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection className="mx-auto max-w-[1200px] px-4 md:px-8" delay={0.24}>
          <section
            className={cn(
              'rounded-3xl border border-[#e8decb] bg-white p-5 shadow-soft md:p-6',
              !leadReady && 'pointer-events-none',
            )}
          >
            <SectionHeading
              title="Please Select Your Visa Type"
              subtitle="Choose the visa path that aligns with your current residency plan."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visaOptions.map((option) => {
                const selected = selectedVisaId === option.id

                return (
                  <motion.article
                    key={option.id}
                    whileHover={leadReady ? { y: -4 } : undefined}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-white shadow-soft transition',
                      selected ? 'border-[#d6a456]' : 'border-[#e8decb]',
                    )}
                  >
                    <img src={option.image} alt={option.name} className="h-40 w-full border-b border-[#e8decb] object-cover" />
                    <div className="space-y-3 p-4">
                      <h3 className="text-base font-semibold">{option.name}</h3>
                      <p className="text-xs text-slate-600">{option.description}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-[#ab8134]">
                          {option.fee === 0 ? 'Included' : `+${formatAed(option.fee)}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedVisaId(option.id)}
                          className={cn(
                            'rounded-full px-4 py-2 text-xs font-semibold transition',
                            selected
                              ? 'bg-[#10131a] text-white'
                              : 'border border-[#e4d9c6] bg-white text-[#34435d] hover:border-[#c8b48b]',
                          )}
                          aria-label={option.ctaLabel}
                        >
                          {selected ? 'Selected' : option.ctaLabel}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection className="mx-auto max-w-[1200px] px-4 md:px-8" delay={0.28}>
          <section
            className={cn(
              'rounded-3xl border border-[#e8decb] bg-white p-5 shadow-soft md:p-6',
              !leadReady && 'pointer-events-none',
            )}
          >
            <SectionHeading
              title="Add-ons"
              subtitle="Layer optional services to customize operations, support, and financial management."
            />
            <div className="mt-5 space-y-4">
              {addOnGroups.map((group) => {
                const groupItems = addOnOptions.filter((item) => group.itemIds.includes(item.id))

                return (
                  <article key={group.id} className="rounded-2xl border border-[#e8decb] bg-[#fffbf5] p-4">
                    <h3 className="text-base font-semibold">{group.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{group.description}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {groupItems.map((item) => {
                        const selected = selectedAddOnIds.includes(item.id)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleAddOn(item.id)}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                              selected
                                ? 'border-[#d6a456] bg-[#f7efe0] text-[#ab8134]'
                                : 'border-[#e5dccb] bg-white text-[#37445e] hover:border-[#c8b48b]',
                            )}
                            aria-label={`Select ${item.name}`}
                          >
                            {item.name}
                            <span className="ml-1 text-[11px] text-[#8e7137]">+{formatAed(item.fee)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection className="mx-auto max-w-[1200px] px-4 md:px-8" delay={0.32}>
          <section className="rounded-3xl border border-[#e5dccb] bg-white p-6 shadow-soft md:p-7">
            <SectionHeading
              title="Finalize and Generate Your Quote"
              subtitle="Validate your selections and generate a complete front-end quote summary instantly."
            />

            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="rounded-2xl border border-[#e9dfcc] bg-[#fdf8ef] p-4 text-sm text-slate-600">
                <p className="font-semibold text-[#7f642d]">Your current estimate: {formatAed(quote.total)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Includes selected license, duration adjustments, shareholder fees, activities, visa path,
                  add-ons, and platform processing.
                </p>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#10131a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#222a3a]"
                aria-label="Get instant quote"
              >
                <Sparkles size={15} />
                Get Instant Quote
              </button>
            </div>
          </section>
        </AnimatedSection>
          </>
        )}
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-[#0f1423]/55 p-4"
          >
            <motion.section
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={{ duration: 0.24 }}
              className="w-full max-w-[500px] rounded-3xl border border-[#e5dccb] bg-white p-6 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e7137]">Quote Ready</p>
                  <h2 className="mt-1 text-2xl font-semibold">Your setup estimate is prepared</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuccess(false)}
                  className="rounded-full border border-[#e5dccb] p-1.5 text-slate-500"
                  aria-label="Close success modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl border border-[#e9dfcc] bg-[#fdf8ef] p-4">
                <QuoteRow label="Estimate ID" value={estimateId} />
                <QuoteRow label="Primary license" value={selectedLicense?.name ?? 'Not selected'} />
                <QuoteRow label="Total" value={formatAed(quote.total)} />
              </div>

              <p className="mt-4 text-sm text-slate-600">
                Your details are captured locally for this prototype. Connect an API endpoint in the next
                iteration to submit this quote directly to your CRM.
              </p>

              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d6a456] px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Check size={15} />
                Close Summary
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
