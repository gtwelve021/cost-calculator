import type { PropsWithChildren, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

interface ModalShellProps extends PropsWithChildren {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  imageSrc?: string;
  imageAlt?: string;
  footer?: ReactNode;
}

export function ModalShell({
  children,
  footer,
  imageAlt,
  imageSrc,
  isOpen,
  onClose,
  title,
}: ModalShellProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-[#0f1422]/60"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_28px_70px_rgba(15,20,34,0.28)]"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex items-center justify-end gap-4 px-6 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#e4e8ef] text-slate-500 transition hover:border-[#cad2de] hover:text-[#111723]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-6 pb-10 pt-4">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={imageAlt ?? title}
                  className="h-60 w-full rounded-[1.5rem] border border-[#edf1f7] object-cover"
                />
              ) : null}
            </div>
            <h2 className="px-6 pb-2 text-xl font-semibold">
              {title}
            </h2>
            <div className="px-6 pb-6 pt-2 overflow-auto h-36">
              <div className="space-y-4 text-sm leading-6 font-normal text-slate-600">
                {children}
              </div>
            </div>
            {footer ? (
              <div className="border-t border-[#eef2f6] px-6 py-5">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface ModalActionProps {
  label: string;
  onClick: () => void;
}

export function ModalAction({ label, onClick }: ModalActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="brand-gradient brand-gradient-hover inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-6 py-3 text-sm font-semibold"
    >
      {label}
      <ArrowRight size={16} />
    </button>
  );
}
