import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogIn, Menu, Search, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import type { HeaderNavSection } from '../../types/calculator'
import { cn } from '../../utils/cn'
import { DubaiMark, G12Mark } from './BrandMarks'

interface CostCalculatorHeaderProps {
  navSections: HeaderNavSection[]
}

export function CostCalculatorHeader({ navSections }: CostCalculatorHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(navSections[0]?.label ?? null)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/20 bg-[#f3f4f7]/92 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 py-3 md:px-8">
          <div className="hidden items-center justify-between lg:flex">
            <a href="/" aria-label="G12 Free Zone home">
              <DubaiMark />
            </a>
            <a href="/" aria-label="G12 Free Zone home">
              <G12Mark />
            </a>
          </div>

          <div className="flex items-center justify-between gap-3 lg:hidden">
            <a href="/" aria-label="G12 Free Zone home">
              <G12Mark />
            </a>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#111723] shadow-[0_8px_18px_rgba(15,20,34,0.08)]"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <button
                type="button"
                className="brand-gradient brand-gradient-hover grid h-11 w-11 place-items-center rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
                onClick={() => setMobileMenuOpen((current) => !current)}
                aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          <div className="mt-3 hidden items-center justify-between gap-6 rounded-full bg-white px-4 py-3 shadow-[0_16px_36px_rgba(15,20,34,0.08)] lg:flex">
            <nav className="flex items-center gap-2">
              {navSections.map((section) => (
                <button
                  key={section.label}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#111723] transition hover:bg-[#f2f5f9]"
                >
                  {section.label}
                  {section.items?.length ? <ChevronDown size={14} className="text-slate-500" /> : null}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full text-[#111723] transition hover:bg-[#f2f5f9]"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full text-[#111723] transition hover:bg-[#f2f5f9]"
                aria-label="Account"
              >
                <UserRound size={18} />
              </button>
              <button
                type="button"
                className="brand-gradient brand-gradient-hover rounded-full px-5 py-3 text-sm font-semibold"
              >
                Book An Appointment
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed inset-x-4 top-[4.75rem] z-[60] overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_70px_rgba(15,20,34,0.22)] lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-[#eef2f6] px-5 py-5">
              <a href="/" aria-label="G12 Free Zone home">
                <DubaiMark className="scale-[0.9] origin-left" />
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#e6eaf0] text-slate-500"
                aria-label="Close mobile menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
              <nav className="space-y-2">
                {navSections.map((section) => {
                  const expanded = expandedSection === section.label

                  return (
                    <div key={section.label} className="rounded-[1.4rem] border border-[#edf1f7] bg-[#fbfcfe] px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedSection(expanded ? null : section.label)}
                        className="flex w-full items-center justify-between gap-4 text-left text-base font-semibold text-[#111723]"
                      >
                        {section.label}
                        {section.items?.length ? (
                          <ChevronDown size={18} className={cn('transition', expanded && 'rotate-180')} />
                        ) : null}
                      </button>

                      {expanded && section.items?.length ? (
                        <div className="mt-3 space-y-2 border-t border-[#edf1f7] pt-3">
                          {section.items.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-white"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </nav>

              <div className="mt-5 space-y-3 border-t border-[#eef2f6] pt-4">
                <button
                  type="button"
                  className="brand-gradient brand-gradient-hover inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
                >
                  Book an Appointment
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d7deea] px-4 py-3 text-sm font-semibold text-[#111723]"
                >
                  <LogIn size={16} />
                  Log Into Portal
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
