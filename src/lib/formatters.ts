import type { AssetCurrency, ReinvestmentMode } from '../types'

const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const krwFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
})

const compactUsdFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const compactKrwFormatter = new Intl.NumberFormat('ko-KR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const wholeNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const decimalNumberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatUsd(value: number): string {
  return `$${usdFormatter.format(value)}`
}

export function formatKrw(value: number): string {
  return `${krwFormatter.format(value)}원`
}

export function formatMoney(value: number, currency: AssetCurrency): string {
  return currency === 'KRW' ? formatKrw(value) : formatUsd(value)
}

export function formatCompactMoney(
  value: number,
  currency: AssetCurrency,
): string {
  if (currency === 'KRW') {
    return `${compactKrwFormatter.format(value)}원`
  }

  return `$${compactUsdFormatter.format(value)}`
}

export function formatPercent(decimalRate: number): string {
  return `${(decimalRate * 100).toFixed(2)}%`
}

export function formatShares(
  value: number,
  mode: ReinvestmentMode = 'fractional',
): string {
  if (mode === 'integer') {
    return wholeNumberFormatter.format(value)
  }

  return decimalNumberFormatter.format(value)
}

export function formatNumber(value: number): string {
  return decimalNumberFormatter.format(value)
}

export function formatGoalReach(month: number | null, maxYears: number): string {
  if (month === null) {
    return `${maxYears}년 안에는 미도달`
  }

  if (month === 0) {
    return '이미 목표 달성'
  }

  const years = Math.floor(month / 12)
  const months = month % 12

  if (years === 0) {
    return `${months}개월 뒤`
  }

  if (months === 0) {
    return `${years}년 뒤`
  }

  return `${years}년 ${months}개월 뒤`
}

export function formatCsvNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2)
}

export function toKrw(
  value: number,
  currency: AssetCurrency,
  usdKrwRate: number,
): number | null {
  if (currency === 'KRW') {
    return value
  }

  if (usdKrwRate <= 0) {
    return null
  }

  return value * usdKrwRate
}
