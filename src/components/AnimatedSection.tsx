import type { PropsWithChildren } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

interface AnimatedSectionProps {
  className?: string
  delay?: number
  id?: string
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  id,
}: PropsWithChildren<AnimatedSectionProps>) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
      className={cn('relative', className)}
    >
      {children}
    </motion.section>
  )
}
