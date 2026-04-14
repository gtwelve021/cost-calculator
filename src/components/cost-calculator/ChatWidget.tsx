import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircleMore, Minimize2, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChatWidgetCopy } from '../../types/calculator'

interface ChatWidgetProps {
  copy: ChatWidgetCopy
}

export function ChatWidget({ copy }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const startEnabled = useMemo(() => {
    return Boolean(name.trim() && email.trim() && phone.trim() && message.trim())
  }, [email, message, name, phone])

  return (
    <div className="fixed bottom-4 right-4 z-[65]">
      {!isOpen ? (
        <div className="flex items-end gap-3">
          <div className="hidden rounded-2xl bg-white px-4 py-3 shadow-[0_16px_36px_rgba(15,20,34,0.16)] md:block">
            <p className="text-[1rem] font-semibold text-[#111723]">{copy.headline}</p>
            <p className="text-sm text-slate-500">{copy.prompt}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="grid h-16 w-16 place-items-center rounded-full bg-[#171b22] text-white shadow-[0_18px_40px_rgba(0,0,0,0.26)]"
            aria-label="Open live chat"
          >
            <MessageCircleMore size={26} />
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-[1.8rem] bg-white shadow-[0_28px_70px_rgba(15,20,34,0.24)]"
          >
            <div className="brand-gradient flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-white/70">Support</p>
                <h2 className="text-[1.2rem] font-semibold">Chat with us now</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10"
                aria-label="Minimize live chat window"
              >
                <Minimize2 size={18} />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name (required)"
                className="w-full rounded-2xl border border-[#e3e7ef] bg-[#f7f8fb] px-4 py-3 text-sm outline-none transition focus:border-[#111111]"
                aria-label="Enter your name"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your Email address (required)"
                className="w-full rounded-2xl border border-[#e3e7ef] bg-[#f7f8fb] px-4 py-3 text-sm outline-none transition focus:border-[#111111]"
                aria-label="Enter your Email address"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Enter your phone number (required)"
                className="w-full rounded-2xl border border-[#e3e7ef] bg-[#f7f8fb] px-4 py-3 text-sm outline-none transition focus:border-[#111111]"
                aria-label="Enter your phone number"
              />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type your message and hit 'Enter'"
                rows={5}
                className="w-full rounded-2xl border border-[#e3e7ef] bg-[#f7f8fb] px-4 py-3 text-sm outline-none transition focus:border-[#111111]"
                aria-label="Type your message and hit 'Enter'"
              />

              <button
                type="button"
                disabled={!startEnabled}
                className="brand-gradient brand-gradient-hover inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={16} />
                Start Chat
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
