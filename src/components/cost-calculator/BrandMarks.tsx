import { Shield } from 'lucide-react'
import { cn } from '../../utils/cn'

interface BrandMarkProps {
  className?: string
  dark?: boolean
}

export function DubaiMark({ className, dark = false }: BrandMarkProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'grid h-10 w-10 place-items-center rounded-full border text-[10px] font-bold',
          dark ? 'border-white/25 bg-white/10 text-white' : 'border-[#d8deea] bg-white text-[#a57c2d]',
        )}
      >
        <Shield size={18} />
      </div>
      <div className="leading-none">
        <p className={cn('text-[0.58rem] uppercase tracking-[0.18em]', dark ? 'text-white/60' : 'text-slate-500')}>
          Government of Dubai
        </p>
        <p className={cn('mt-1 text-xs font-semibold', dark ? 'text-white' : 'text-[#111723]')}>
          G12 Free Zone
        </p>
      </div>
    </div>
  )
}

export function G12Mark({ className, dark = false }: BrandMarkProps) {
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('text-[1.35rem] font-semibold tracking-[-0.06em]', dark ? 'text-white' : 'text-[#ab8134]')}>
        G12
      </span>
      <span
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold',
          dark ? 'border-[#8dd86a] text-[#8dd86a]' : 'border-[#8bcf67] text-[#74b64c]',
        )}
      >
        FZ
      </span>
    </div>
  )
}
