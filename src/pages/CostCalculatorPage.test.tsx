import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CostCalculatorPage } from './CostCalculatorPage'

describe('CostCalculatorPage', () => {
  it(
    'completes a happy path and opens quote summary modal',
    async () => {
      render(<CostCalculatorPage />)
      const user = userEvent.setup()

      fireEvent.change(screen.getByLabelText(/enter your full name/i), {
        target: { value: 'Ali Khan' },
      })
      await user.clear(screen.getByLabelText(/enter phone number/i))
      await user.type(screen.getByLabelText(/enter phone number/i), '3001234567')
      fireEvent.change(screen.getByLabelText(/enter email address/i), {
        target: { value: 'ali@example.com' },
      })
      fireEvent.click(screen.getByRole('checkbox', { name: /terms and privacy policy/i }))

      fireEvent.click(screen.getByRole('button', { name: /calculate/i }))
      await screen.findByText(/pick from two powerful license options/i, {}, { timeout: 3000 })
      fireEvent.click(screen.getByRole('button', { name: /select growth license/i }))
      fireEvent.click(screen.getByRole('button', { name: /add software development/i }))
      fireEvent.click(screen.getByRole('button', { name: /choose employee visa/i }))
      fireEvent.click(screen.getByRole('button', { name: /select bookkeeping suite/i }))

      fireEvent.click(screen.getAllByRole('button', { name: /get instant quote/i })[0])

      expect(await screen.findByText(/quote ready/i, {}, { timeout: 3000 })).toBeInTheDocument()
      expect(screen.getByText(/estimate id/i)).toBeInTheDocument()
    },
    30000,
  )
})
