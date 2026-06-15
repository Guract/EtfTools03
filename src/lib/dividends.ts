import type { DividendFrequency } from '../types'

export const DIVIDEND_FREQUENCY_OPTIONS: Array<{
  value: DividendFrequency
  label: string
}> = [
  { value: 'monthly', label: '월 배당' },
  { value: 'quarterly', label: '분기 배당' },
  { value: 'semiannual', label: '반기 배당' },
  { value: 'annual', label: '연 배당' },
  { value: 'irregular', label: '불규칙 배당' },
  { value: 'none', label: '배당 없음' },
]

const DEFAULT_PAYMENT_MONTHS: Record<DividendFrequency, number[]> = {
  none: [],
  monthly: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  quarterly: [3, 6, 9, 12],
  semiannual: [6, 12],
  annual: [12],
  irregular: [3, 6, 9, 12],
}

export function getDividendFrequencyLabel(frequency: DividendFrequency): string {
  return (
    DIVIDEND_FREQUENCY_OPTIONS.find((option) => option.value === frequency)
      ?.label ?? '배당 주기 미확인'
  )
}

export function getDefaultDividendPaymentMonths(
  frequency: DividendFrequency,
): number[] {
  return [...DEFAULT_PAYMENT_MONTHS[frequency]]
}

export function getDividendPaymentsPerYear(
  frequency: DividendFrequency,
  paymentMonths: number[] = [],
): number {
  if (frequency === 'none') {
    return 0
  }

  if (frequency === 'monthly') {
    return 12
  }

  const uniqueMonths = new Set(paymentMonths)

  if (uniqueMonths.size > 0) {
    return uniqueMonths.size
  }

  return DEFAULT_PAYMENT_MONTHS[frequency].length
}

export function getDividendPaymentMonths(
  frequency: DividendFrequency,
  paymentMonths: number[] = [],
): number[] {
  if (frequency === 'none') {
    return []
  }

  if (frequency === 'monthly') {
    return getDefaultDividendPaymentMonths('monthly')
  }

  const normalizedMonths = Array.from(
    new Set(
      paymentMonths.filter(
        (month) => Number.isInteger(month) && month >= 1 && month <= 12,
      ),
    ),
  ).sort((left, right) => left - right)

  return normalizedMonths.length > 0
    ? normalizedMonths
    : getDefaultDividendPaymentMonths(frequency)
}

export function isDividendPaymentMonth(
  frequency: DividendFrequency,
  paymentMonths: number[],
  calendarMonth: number,
): boolean {
  if (frequency === 'none') {
    return false
  }

  if (frequency === 'monthly') {
    return true
  }

  return getDividendPaymentMonths(frequency, paymentMonths).includes(
    calendarMonth,
  )
}

export function getDividendPaymentUnitLabel(
  frequency: DividendFrequency,
): string {
  if (frequency === 'monthly') {
    return '월 1회'
  }

  if (frequency === 'quarterly') {
    return '분기 1회'
  }

  if (frequency === 'semiannual') {
    return '반기 1회'
  }

  if (frequency === 'annual') {
    return '연 1회'
  }

  if (frequency === 'irregular') {
    return '지급 1회'
  }

  return '배당 없음'
}

export function getDividendPaymentMonthsLabel(
  frequency: DividendFrequency,
  paymentMonths: number[] = [],
): string {
  if (frequency === 'none') {
    return '배당 없음'
  }

  if (frequency === 'monthly') {
    return '매월'
  }

  return `${getDividendPaymentMonths(frequency, paymentMonths).join(', ')}월`
}
