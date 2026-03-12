import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultCalculatorState } from '../config/calculatorConfig'
import { CALCULATOR_STATE_KEY } from '../utils/persistence'
import { CostCalculatorPage } from './CostCalculatorPage'

describe('CostCalculatorPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

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

  it('starts with no preselected options and zero total', () => {
    render(<CostCalculatorPage />)

    expect(screen.getAllByText('AED 0.00').length).toBeGreaterThan(0)
    expect(screen.queryByText(/^Selected$/i)).not.toBeInTheDocument()
  })

  it('shows required-only message when phone is empty', async () => {
    render(<CostCalculatorPage />)

    fireEvent.change(screen.getByLabelText(/enter your full name/i), {
      target: { value: 'Ali Khan' },
    })
    fireEvent.change(screen.getByLabelText(/enter email address/i), {
      target: { value: 'ali@example.com' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: /terms and privacy policy/i }))

    fireEvent.click(screen.getByRole('button', { name: /calculate/i }))

    expect(await screen.findByText(/phone number is required/i)).toBeInTheDocument()
    expect(screen.queryByText(/pick from two powerful license options/i)).not.toBeInTheDocument()
  })

  it('shows invalid message when the phone number is incomplete', async () => {
    render(<CostCalculatorPage />)
    const user = userEvent.setup()

    fireEvent.change(screen.getByLabelText(/enter your full name/i), {
      target: { value: 'Ali Khan' },
    })
    await user.clear(screen.getByLabelText(/enter phone number/i))
    await user.type(screen.getByLabelText(/enter phone number/i), '300123456')
    fireEvent.change(screen.getByLabelText(/enter email address/i), {
      target: { value: 'ali@example.com' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: /terms and privacy policy/i }))

    fireEvent.click(screen.getByRole('button', { name: /calculate/i }))

    expect(await screen.findByText(/please enter a valid phone number/i)).toBeInTheDocument()
    expect(screen.queryByText(/pick from two powerful license options/i)).not.toBeInTheDocument()
  })

  it('strips numbers from the full name field', async () => {
    render(<CostCalculatorPage />)
    const user = userEvent.setup()

    const fullNameInput = screen.getByLabelText(/enter your full name/i) as HTMLInputElement

    await user.type(fullNameInput, 'Ali123 Khan45')

    expect(fullNameInput.value).toBe('Ali Khan')
  })

  it('keeps the quote overlay hidden on load when partial lead data exists in storage', () => {
    window.localStorage.setItem(
      CALCULATOR_STATE_KEY,
      JSON.stringify({
        ...defaultCalculatorState,
        leadForm: {
          fullName: 'Ali Khan',
          phone: '',
          email: '',
          consent: false,
        },
      }),
    )

    render(<CostCalculatorPage />)

    expect(screen.queryByText(/your custom quote awaits/i)).not.toBeInTheDocument()
  })
})
