import { Facebook, Instagram, Linkedin, Plus, Twitter, Youtube } from 'lucide-react'
import { useState } from 'react'
import type { FooterLinkGroup } from '../../types/calculator'
import { cn } from '../../utils/cn'
import { DubaiMark, G12Mark } from './BrandMarks'

interface CostCalculatorFooterProps {
  groups: FooterLinkGroup[]
}

const socialIcons = [Facebook, Instagram, Linkedin, Twitter, Youtube]

export function CostCalculatorFooter({ groups }: CostCalculatorFooterProps) {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

  return (
    <footer className="mt-20 bg-[radial-gradient(circle_at_top,#10151e_0%,#05070a_60%)] text-white">
      <div className="mx-auto max-w-[1280px] px-4 pb-8 pt-10 md:px-8 md:pb-10 md:pt-14">
        <div className="hidden grid-cols-4 gap-8 lg:grid">
          {groups.map((group) => (
            <div key={group.id} className="space-y-4">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <div className="space-y-2.5">
                {group.links.map((link) => (
                  <button
                    key={link}
                    type="button"
                    className="block text-left text-sm text-white/65 transition hover:text-white"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 lg:hidden">
          {groups.map((group) => {
            const expanded = expandedGroupId === group.id

            return (
              <div key={group.id} className="border-b border-white/8 pb-3">
                <button
                  type="button"
                  onClick={() => setExpandedGroupId(expanded ? null : group.id)}
                  className="flex w-full items-center justify-between gap-4 py-2 text-left text-[1.15rem] font-semibold"
                >
                  {group.title}
                  <Plus size={18} className={cn('transition', expanded && 'rotate-45')} />
                </button>

                {expanded ? (
                  <div className="space-y-2 pt-2">
                    {group.links.map((link) => (
                      <button
                        key={link}
                        type="button"
                        className="block text-left text-sm text-white/65 transition hover:text-white"
                      >
                        {link}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="mt-10 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-end">
            <div className="flex flex-col items-center gap-5 md:items-start">
              <div className="flex items-center gap-5">
                <a href="/" aria-label="G12 Free Zone home">
                  <DubaiMark dark />
                </a>
                <a href="/" aria-label="G12 Free Zone home">
                  <G12Mark dark />
                </a>
              </div>

              <div className="flex flex-col items-center gap-4 md:items-start">
                <div className="space-y-2 text-center md:text-left">
                  <p className="text-sm font-semibold">G12 Free Zone Corporate</p>
                  <div className="flex items-center justify-center gap-3 md:justify-start">
                    {socialIcons.map((Icon, index) => (
                      <button
                        key={`corporate-${index}`}
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/12 text-white/65 transition hover:border-[#d6a456]/60 hover:text-[#f6d197]"
                      >
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-center md:text-left">
                  <p className="text-sm font-semibold">G12 Free Zone Events</p>
                  <div className="flex items-center justify-center gap-3 md:justify-start">
                    {[Instagram, Linkedin].map((Icon, index) => (
                      <button
                        key={`events-${index}`}
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/12 text-white/65 transition hover:border-[#d6a456]/60 hover:text-[#f6d197]"
                      >
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-white/60">&copy; 2026 G12 Free Zone. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
