import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultCalculatorState } from '../config/calculatorConfig'
import { CALCULATOR_STATE_KEY } from '../utils/persistence'
import { CostCalculatorPage } from './CostCalculatorPage'

function persistUnlockedLead() {
  window.localStorage.setItem(
    CALCULATOR_STATE_KEY,
    JSON.stringify({
      ...defaultCalculatorState,
      leadForm: {
        fullName: 'Ali Khan',
        phone: '+971501234567',
        email: 'ali@example.com',
        consent: true,
      },
    }),
  )
}

function persistConfiguredQuote() {
  window.localStorage.setItem(
    CALCULATOR_STATE_KEY,
    JSON.stringify({
      ...defaultCalculatorState,
      leadForm: {
        fullName: 'Ali Khan',
        phone: '+971501234567',
        email: 'ali@example.com',
        consent: true,
      },
      selectedLicenseId: 'fawri',
      selectedActivityIds: ['ict-6201-10'],
      selectedAddOnIds: ['corporate-tax'],
      investorVisaEnabled: true,
      employeeVisaCount: 1,
      applicantsInsideUae: 1,
    }),
  )
}

describe('CostCalculatorPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts with a zero total and keeps the calculator locked', () => {
    render(<CostCalculatorPage />)

    expect(screen.getByRole('heading', { name: /Calculate Your Dubai Trade License Cost Now/i })).toBeInTheDocument()
    expect(screen.getByText(/Tell Us a Few Details to Get Started/i)).toBeInTheDocument()
    expect(screen.queryByText(/Choose your G12 license/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/0\.00/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Open live chat/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Build your Dubai company setup quote in minutes/i)).not.toBeInTheDocument()
  })

  it(
    'unlocks the calculator after a valid lead form is submitted',
    async () => {
      render(<CostCalculatorPage />)
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/Enter your full name/i), 'Ali Khan')
      await user.type(screen.getByLabelText(/Enter phone number/i), '501234567')
      await user.type(screen.getByLabelText(/Enter email address/i), 'ali@example.com')
      await user.click(screen.getByRole('checkbox', { name: /Terms and privacy policy/i }))
      await user.click(screen.getByRole('button', { name: /^Calculate$/i }))

      expect(await screen.findByText(/Choose your G12 license/i)).toBeInTheDocument()
    },
    20000,
  )

  it(
    'opens and closes the license modal',
    async () => {
      persistUnlockedLead()
      render(<CostCalculatorPage />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: /Learn more about Fawri License/i }))

      expect(screen.getByRole('dialog', { name: /Fawri License/i })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /Close modal/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /Fawri License/i })).not.toBeInTheDocument()
      }, { timeout: 5000 })
    },
    20000,
  )

  it(
    'selects activities through the grouped activity modal flow',
    async () => {
      persistUnlockedLead()
      render(<CostCalculatorPage />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: /Explore ICT activities/i }))
      expect(screen.getByRole('dialog', { name: /ICT Activities/i })).toBeInTheDocument()

      await user.click(screen.getByRole('checkbox', { name: /Software Development/i }))
      await user.click(screen.getByRole('button', { name: /Save selected activities/i }))

      await waitFor(() => {
        expect(screen.getAllByText(/Software Development/i).length).toBeGreaterThan(0)
      }, { timeout: 5000 })
    },
    20000,
  )

  it(
    'supports visa updates, add-ons, quote confirmation, and share actions',
    async () => {
      persistConfiguredQuote()
      const share = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', {
        value: share,
        configurable: true,
      })

      render(<CostCalculatorPage />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: /Increase Employee Visa/i }))
      await user.click(screen.getByRole('button', { name: /Get Instant Quote/i }))

      expect(await screen.findByText(/Thank You, Ali!/i)).toBeInTheDocument()
      expect(screen.getByText(/Applicants Inside the UAE \(1\)/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Corporate Tax/i).length).toBeGreaterThan(0)

      await user.click(screen.getByRole('button', { name: /^Share$/i }))
    },
    20000,
  )
})
