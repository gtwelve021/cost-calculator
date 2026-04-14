const currencyFormatter = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatAed(value: number): string {
  return currencyFormatter.format(value)
}
