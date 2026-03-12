import { describe, expect, it } from 'vitest'
import {
  getPhoneCountryCode,
  getPhoneInputValue,
  getLockedPhonePrefixLength,
  getPhoneDialCode,
  getPhoneNationalNumber,
  getPhoneSelection,
  normalizePhoneNumber,
  shouldClearPhoneInput,
  shouldPreventPhonePrefixEdit,
} from './phone'

describe('phone utilities', () => {
  it('treats dial-code-only values as empty', () => {
    expect(normalizePhoneNumber('92', { dialCode: '92' })).toBe('')
  })

  it('uses the provided fallback dial code when country data is missing', () => {
    expect(getPhoneDialCode(undefined, '92')).toBe('92')
  })

  it('uses the provided fallback country code when country data is missing', () => {
    expect(getPhoneCountryCode(undefined, 'ae')).toBe('ae')
  })

  it('derives the selected country and dial code from a stored phone number', () => {
    expect(getPhoneSelection('+923001234567', 'ae', '971')).toEqual({
      country: 'pk',
      dialCode: '92',
    })
  })

  it('returns the national number for display in the editable input', () => {
    expect(getPhoneNationalNumber('+971501234567')).toBe('501234567')
  })

  it('shows the dial code when the saved phone value is empty', () => {
    expect(getPhoneInputValue('', '971')).toBe('+971')
  })

  it('prevents backspace from deleting the locked dial code', () => {
    expect(
      shouldPreventPhonePrefixEdit({
        key: 'Backspace',
        selectionStart: getLockedPhonePrefixLength('92'),
        selectionEnd: getLockedPhonePrefixLength('92'),
        prefixLength: getLockedPhonePrefixLength('92'),
      }),
    ).toBe(true)
  })

  it('allows backspace once the cursor is beyond the locked dial code', () => {
    expect(
      shouldPreventPhonePrefixEdit({
        key: 'Backspace',
        selectionStart: getLockedPhonePrefixLength('92') + 1,
        selectionEnd: getLockedPhonePrefixLength('92') + 1,
        prefixLength: getLockedPhonePrefixLength('92'),
      }),
    ).toBe(false)
  })

  it('prevents typing when the selection overlaps the locked dial code', () => {
    expect(
      shouldPreventPhonePrefixEdit({
        key: '5',
        selectionStart: 0,
        selectionEnd: getLockedPhonePrefixLength('92'),
        prefixLength: getLockedPhonePrefixLength('92'),
      }),
    ).toBe(true)
  })

  it('clears the field when the full value is selected and deleted', () => {
    expect(
      shouldClearPhoneInput({
        key: 'Delete',
        selectionStart: 0,
        selectionEnd: 15,
        inputValue: '+92 300-1234567',
        dialCode: '92',
      }),
    ).toBe(true)
  })

  it('clears the field when only the dial code remains', () => {
    expect(
      shouldClearPhoneInput({
        key: 'Backspace',
        selectionStart: getLockedPhonePrefixLength('92'),
        selectionEnd: getLockedPhonePrefixLength('92'),
        inputValue: '+92',
        dialCode: '92',
      }),
    ).toBe(true)
  })

  it('does not clear the field while local digits still exist', () => {
    expect(
      shouldClearPhoneInput({
        key: 'Backspace',
        selectionStart: getLockedPhonePrefixLength('92') + 1,
        selectionEnd: getLockedPhonePrefixLength('92') + 1,
        inputValue: '+923',
        dialCode: '92',
      }),
    ).toBe(false)
  })
})
