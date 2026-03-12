import { isValidPhoneNumber } from 'libphonenumber-js/min'

interface PhoneCountryData {
  dialCode?: string
}

interface PhonePrefixEditGuard {
  key: string
  selectionStart: number | null
  selectionEnd: number | null
  prefixLength: number
  hasModifier?: boolean
}

export const PHONE_INPUT_PREFIX = '+'

export function normalizePhoneNumber(rawValue: string, countryData?: PhoneCountryData): string {
  const digits = rawValue.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  const dialCode = typeof countryData?.dialCode === 'string' ? countryData.dialCode : ''

  if (!dialCode) {
    return `+${digits}`
  }

  if (digits === dialCode) {
    return ''
  }

  if (digits.startsWith(dialCode)) {
    return `+${digits}`
  }

  const localNumber = digits.replace(/^0+/, '')

  return `+${dialCode}${localNumber || digits}`
}

export function getPhoneDialCode(countryData?: PhoneCountryData | null, fallback = ''): string {
  const dialCode = typeof countryData?.dialCode === 'string' ? countryData.dialCode : ''

  return dialCode || fallback
}

export function getLockedPhonePrefixLength(dialCode: string, prefix = PHONE_INPUT_PREFIX): number {
  return `${prefix}${dialCode}`.length
}

export function shouldPreventPhonePrefixEdit({
  key,
  selectionStart,
  selectionEnd,
  prefixLength,
  hasModifier = false,
}: PhonePrefixEditGuard): boolean {
  if (prefixLength <= 0) {
    return false
  }

  const start = selectionStart ?? prefixLength
  const end = selectionEnd ?? prefixLength
  const hasSelection = start !== end
  const selectionTouchesPrefix = start < prefixLength || end < prefixLength

  if (key === 'Backspace') {
    return hasSelection ? selectionTouchesPrefix : start <= prefixLength
  }

  if (key === 'Delete') {
    return hasSelection ? selectionTouchesPrefix : start < prefixLength
  }

  if (!hasModifier && key.length === 1) {
    return selectionTouchesPrefix
  }

  return false
}

export function isValidLeadPhoneNumber(phone: string): boolean {
  const normalizedPhone = phone.trim()

  if (!normalizedPhone) {
    return false
  }

  try {
    return isValidPhoneNumber(normalizedPhone)
  } catch {
    return false
  }
}
