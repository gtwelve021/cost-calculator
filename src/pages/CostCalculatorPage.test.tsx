import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CostCalculatorPage } from './CostCalculatorPage'

describe('CostCalculatorPage', () => {
  it(
    'completes a happy path and opens quote summary modal',
    async () => {
      render(<CostCalculatorPage />)

      fireEvent.change(screen.getByLabelText(/enter your full name/i), {
        target: { value: 'Ali Khan' },
      })
      fireEvent.change(screen.getByLabelText(/enter phone number/i), {
        target: { value: '+971501234567' },
      })
      fireEvent.change(screen.getByLabelText(/enter email address/i), {
        target: { value: 'ali@example.com' },
      })
      fireEvent.click(screen.getByRole('checkbox', { name: /terms and privacy policy/i }))

      fireEvent.click(screen.getByRole('button', { name: /calculate/i }))
      fireEvent.click(await screen.findByRole('button', { name: /select growth license/i }))
      fireEvent.click(screen.getByRole('button', { name: /add software development/i }))
      fireEvent.click(screen.getByRole('button', { name: /choose employee visa/i }))
      fireEvent.click(screen.getByRole('button', { name: /select bookkeeping suite/i }))

      fireEvent.click(screen.getAllByRole('button', { name: /get instant quote/i })[0])

      expect(await screen.findByText(/quote ready/i, {}, { timeout: 3000 })).toBeInTheDocument()
      expect(screen.getByText(/estimate id/i)).toBeInTheDocument()
    },
    15000,
  )
})
