import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js/min'

interface PhoneCountryData {
  dialCode?: string
  countryCode?: string
}

interface PhonePrefixEditGuard {
  key: string
  selectionStart: number | null
  selectionEnd: number | null
  prefixLength: number
  hasModifier?: boolean
}

interface PhoneClearGuard {
  key: string
  selectionStart: number | null
  selectionEnd: number | null
  inputValue: string
  dialCode: string
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

export function getPhoneCountryCode(countryData?: PhoneCountryData | null, fallback = ''): string {
  const countryCode = typeof countryData?.countryCode === 'string' ? countryData.countryCode : ''

  return countryCode || fallback
}

export function getPhoneSelection(
  phone: string,
  fallbackCountry = '',
  fallbackDialCode = '',
): { country: string; dialCode: string } {
  const normalizedPhone = phone.trim()

  if (!normalizedPhone) {
    return {
      country: fallbackCountry,
      dialCode: fallbackDialCode,
    }
  }

  try {
    const parsedPhone = parsePhoneNumberFromString(normalizedPhone)

    return {
      country: parsedPhone?.country?.toLowerCase() ?? fallbackCountry,
      dialCode: parsedPhone?.countryCallingCode ?? fallbackDialCode,
    }
  } catch {
    return {
      country: fallbackCountry,
      dialCode: fallbackDialCode,
    }
  }
}

export function getPhoneNationalNumber(phone: string): string {
  const normalizedPhone = phone.trim()

  if (!normalizedPhone) {
    return ''
  }

  try {
    return parsePhoneNumberFromString(normalizedPhone)?.nationalNumber ?? normalizedPhone.replace(/\D/g, '')
  } catch {
    return normalizedPhone.replace(/\D/g, '')
  }
}

export function getPhoneInputValue(phone: string, dialCode: string): string {
  const normalizedPhone = phone.trim()

  if (normalizedPhone) {
    return normalizedPhone
  }

  return dialCode ? `+${dialCode}` : ''
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

export function shouldClearPhoneInput({
  key,
  selectionStart,
  selectionEnd,
  inputValue,
  dialCode,
}: PhoneClearGuard): boolean {
  if ((key !== 'Backspace' && key !== 'Delete') || !inputValue) {
    return false
  }

  const start = selectionStart ?? inputValue.length
  const end = selectionEnd ?? inputValue.length

  if (start === 0 && end === inputValue.length) {
    return true
  }

  const digits = inputValue.replace(/\D/g, '')

  return Boolean(dialCode) && digits === dialCode
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
