import { describe, expect, it } from 'vitest'
import {
  getLockedPhonePrefixLength,
  getPhoneDialCode,
  normalizePhoneNumber,
  shouldPreventPhonePrefixEdit,
} from './phone'

describe('phone utilities', () => {
  it('treats dial-code-only values as empty', () => {
    expect(normalizePhoneNumber('92', { dialCode: '92' })).toBe('')
  })

  it('uses the provided fallback dial code when country data is missing', () => {
    expect(getPhoneDialCode(undefined, '92')).toBe('92')
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
})
