const fullNamePattern = /^[\p{L}\s'.-]+$/u

export function sanitizeLeadFullNameInput(value: string): string {
  return value.replace(/\d+/g, '')
}

export function isValidLeadFullName(fullName: string): boolean {
  const normalizedFullName = fullName.trim().replace(/\s+/g, ' ')

  if (normalizedFullName.length < 2) {
    return false
  }

  if (!fullNamePattern.test(normalizedFullName)) {
    return false
  }

  const letterCount = (normalizedFullName.match(/\p{L}/gu) ?? []).length

  return letterCount >= 2
}
