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
        residenceCountry: 'AE',
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
        residenceCountry: 'AE',
        phone: '+971501234567',
        email: 'ali@example.com',
        consent: true,
      },
      selectedLicenseId: 'regular',
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
    expect(screen.queryByText(/Pick From Two Powerful Business License Options/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/AED.*0/i).length).toBeGreaterThan(0)
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
      await user.selectOptions(screen.getByLabelText(/Current Country of Residence/i), 'AE')
      await user.type(screen.getByLabelText(/Enter phone number/i), '501234567')
      await user.type(screen.getByLabelText(/Enter email address/i), 'ali@example.com')
      await user.click(screen.getByRole('checkbox', { name: /Terms and privacy policy/i }))
      await user.click(screen.getByRole('button', { name: /^Calculate$/i }))

      expect(await screen.findByText(/Select Jurisdiction/i)).toBeInTheDocument()
    },
    20000,
  )

  it(
    'shows a validation error for an invalid email address',
    async () => {
      render(<CostCalculatorPage />)
      const user = userEvent.setup()

      const email = screen.getByLabelText(/Enter email address/i)

      await user.type(email, 'asdadad')
      await user.tab()

      expect(await screen.findByText(/Please enter a valid email address\./i)).toBeInTheDocument()
    },
    20000,
  )

  it(
    'keeps the dial code visible when local phone digits are deleted with backspace',
    async () => {
      render(<CostCalculatorPage />)
      const user = userEvent.setup()
      const phone = screen.getByLabelText(/Enter phone number/i)

      await user.type(phone, '501')
      await user.keyboard('{Backspace}{Backspace}{Backspace}')

      await waitFor(() => {
        expect(phone).toHaveValue('+971')
      })
    },
    20000,
  )

  it(
    'opens the license modal',
    async () => {
      persistUnlockedLead()
      render(<CostCalculatorPage />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: /Learn more about Mainland/i }))

      expect(screen.getByRole('dialog', { name: /Mainland/i })).toBeInTheDocument()
    },
    20000,
  )

  it(
    'selects activities through the grouped activity modal flow',
    async () => {
      persistUnlockedLead()
      render(<CostCalculatorPage />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: /ICT/i }))
      expect(screen.getByRole('dialog', { name: /ICT Activities/i })).toBeInTheDocument()

      const softwareDevCheckbox = screen.getByRole('checkbox', { name: /Software Development/i })
      await user.click(softwareDevCheckbox)
      expect(softwareDevCheckbox).toBeChecked()
      await user.click(screen.getByRole('button', { name: /Save selected activities/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /ICT Activities/i })).not.toBeInTheDocument()
      }, { timeout: 5000 })
    },
    20000,
  )

  it(
    'shows mainland consultation message and skips calculator flow',
    async () => {
      persistUnlockedLead()
      render(<CostCalculatorPage />)
      const user = userEvent.setup()

      await user.click(screen.getAllByRole('button', { name: /^Select$/i })[0])

      expect(
        screen.getAllByText(
          /Mainland license starts from 50,000 AED\. Please contact us for consultation\./i,
        ).length,
      ).toBeGreaterThan(0)
      expect(screen.queryByText(/Select Your Business Activities/i)).not.toBeInTheDocument()
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

