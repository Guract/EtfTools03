import type {
  AssetCurrency,
  DividendEstimateMode,
  DividendFrequency,
  EtfDividendPoint,
  EtfPreset,
  EtfPricePoint,
  EtfSnapshot,
} from '../types'
import {
  getDefaultDividendPaymentMonths,
  getDividendPaymentsPerYear,
} from './dividends'

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[]
    error?: {
      description?: string
    } | null
  }
}

interface YahooChartResult {
  meta?: {
    currency?: string
    symbol?: string
    exchangeName?: string
    fullExchangeName?: string
    regularMarketPrice?: number
    regularMarketTime?: number
    longName?: string
    shortName?: string
  }
  timestamp?: number[]
  indicators?: {
    quote?: Array<{
      close?: Array<number | null>
    }>
  }
  events?: {
    dividends?: Record<
      string,
      {
        amount?: number
        date?: number
      }
    >
  }
}

export const ETF_PRESETS: EtfPreset[] = [
  {
    symbol: 'QQQI',
    name: 'NEOS NASDAQ-100 High Income ETF',
    market: 'US',
    currency: 'USD',
    category: '월배당',
    note: '나스닥100 커버드콜형 고배당 ETF',
  },
  {
    symbol: 'JEPQ',
    name: 'JPMorgan Nasdaq Equity Premium Income ETF',
    market: 'US',
    currency: 'USD',
    category: '월배당',
    note: '나스닥 기반 프리미엄 인컴 ETF',
  },
  {
    symbol: 'JEPI',
    name: 'JPMorgan Equity Premium Income ETF',
    market: 'US',
    currency: 'USD',
    category: '월배당',
    note: '미국 대형주 프리미엄 인컴 ETF',
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    market: 'US',
    currency: 'USD',
    category: '성장',
    note: '나스닥100 대표 ETF',
  },
  {
    symbol: 'SCHD',
    name: 'Schwab US Dividend Equity ETF',
    market: 'US',
    currency: 'USD',
    category: '배당성장',
    note: '미국 배당성장 대표 ETF',
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    market: 'US',
    currency: 'USD',
    category: '시장대표',
    note: 'S&P 500 대표 ETF',
  },
  {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    market: 'US',
    currency: 'USD',
    category: '시장대표',
    note: 'S&P 500 저비용 ETF',
  },
  {
    symbol: 'TQQQ',
    name: 'ProShares UltraPro QQQ',
    market: 'US',
    currency: 'USD',
    category: '레버리지',
    note: '나스닥100 3배 레버리지',
  },
  {
    symbol: '069500.KS',
    name: 'KODEX 200',
    market: 'KR',
    currency: 'KRW',
    category: '국내대표',
    note: '코스피200 대표 ETF',
  },
  {
    symbol: '102110.KS',
    name: 'TIGER 200',
    market: 'KR',
    currency: 'KRW',
    category: '국내대표',
    note: '코스피200 대표 ETF',
  },
  {
    symbol: '360750.KS',
    name: 'TIGER 미국S&P500',
    market: 'KR',
    currency: 'KRW',
    category: '국내상장 해외',
    note: '국내 상장 S&P 500 ETF',
  },
  {
    symbol: '379810.KS',
    name: 'KODEX 미국나스닥100TR',
    market: 'KR',
    currency: 'KRW',
    category: '국내상장 해외',
    note: '국내 상장 나스닥100 TR ETF',
  },
  {
    symbol: '458730.KS',
    name: 'TIGER 미국배당다우존스',
    market: 'KR',
    currency: 'KRW',
    category: '국내상장 해외',
    note: '국내 상장 미국 배당 ETF',
  },
]

const VALID_SYMBOL_PATTERN = /^[A-Z0-9.^=-]{1,24}$/

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

function toIsoDate(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toISOString().slice(0, 10)
}

function yearsBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime()
  const end = new Date(`${endDate}T00:00:00Z`).getTime()
  const yearCount = (end - start) / (365.25 * 24 * 60 * 60 * 1000)
  return Math.max(yearCount, 1 / 12)
}

function roundPrice(value: number, currency: AssetCurrency): number {
  return currency === 'KRW' ? Math.round(value) : Number(value.toFixed(2))
}

function asAssetCurrency(value: string | undefined): AssetCurrency {
  return value === 'KRW' ? 'KRW' : 'USD'
}

function parsePricePoints(result: YahooChartResult): EtfPricePoint[] {
  const timestamps = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []

  return timestamps
    .map((timestamp, index) => {
      const close = closes[index]

      if (!isFinitePositive(close)) {
        return null
      }

      return {
        date: toIsoDate(timestamp),
        close,
      }
    })
    .filter((point): point is EtfPricePoint => point !== null)
}

function parseDividends(result: YahooChartResult): EtfDividendPoint[] {
  const dividends = result.events?.dividends

  if (!dividends) {
    return []
  }

  return Object.values(dividends)
    .map((dividend) => {
      if (!isFinitePositive(dividend.amount) || !dividend.date) {
        return null
      }

      return {
        date: toIsoDate(dividend.date),
        amount: dividend.amount,
      }
    })
    .filter((dividend): dividend is EtfDividendPoint => dividend !== null)
    .sort((left, right) => left.date.localeCompare(right.date))
}

function detectDividendFrequency(paymentMonths: number[]): DividendFrequency {
  if (paymentMonths.length >= 8) {
    return 'monthly'
  }

  if (paymentMonths.length >= 3 && paymentMonths.length <= 5) {
    return 'quarterly'
  }

  if (paymentMonths.length === 2) {
    return 'semiannual'
  }

  if (paymentMonths.length === 1) {
    return 'annual'
  }

  return 'irregular'
}

function estimateDividend(dividends: EtfDividendPoint[], currentDate: string) {
  if (dividends.length === 0) {
    return {
      frequency: 'none' as DividendFrequency,
      paymentMonths: [] as number[],
      paymentsPerYear: 0,
      perPaymentMin: 0,
      perPaymentMax: 0,
      perPaymentAverage: 0,
      annualAverage: 0,
      monthlyEquivalentAverage: 0,
      mode: 'none' as DividendEstimateMode,
      lastDividendDate: null,
    }
  }

  const current = new Date(`${currentDate}T00:00:00Z`)
  const oneYearAgo = new Date(current)
  oneYearAgo.setFullYear(current.getFullYear() - 1)
  const oneYearAgoIso = oneYearAgo.toISOString().slice(0, 10)
  const trailing = dividends.filter((dividend) => dividend.date >= oneYearAgoIso)
  const sample = trailing.length > 0 ? trailing : dividends.slice(-12)
  const monthlyTotals = new Map<string, number>()

  sample.forEach((dividend) => {
    const monthKey = dividend.date.slice(0, 7)
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) ?? 0) + dividend.amount)
  })

  const monthlyValues = Array.from(monthlyTotals.values())
  const paymentMonths = Array.from(monthlyTotals.keys())
    .map((monthKey) => Number(monthKey.slice(5, 7)))
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
    .sort((left, right) => left - right)
  const frequency = detectDividendFrequency(paymentMonths)
  const normalizedPaymentMonths =
    paymentMonths.length > 0
      ? paymentMonths
      : getDefaultDividendPaymentMonths(frequency)
  const paymentsPerYear = getDividendPaymentsPerYear(
    frequency,
    normalizedPaymentMonths,
  )
  const perPaymentMin = monthlyValues.length > 0 ? Math.min(...monthlyValues) : 0
  const perPaymentMax = monthlyValues.length > 0 ? Math.max(...monthlyValues) : 0
  const perPaymentAverage =
    monthlyValues.length > 0
      ? monthlyValues.reduce((sum, amount) => sum + amount, 0) /
        monthlyValues.length
      : 0
  const annualAverage = perPaymentAverage * paymentsPerYear

  return {
    frequency,
    paymentMonths: normalizedPaymentMonths,
    paymentsPerYear,
    perPaymentMin: Number(perPaymentMin.toFixed(4)),
    perPaymentMax: Number(perPaymentMax.toFixed(4)),
    perPaymentAverage: Number(perPaymentAverage.toFixed(4)),
    annualAverage: Number(annualAverage.toFixed(4)),
    monthlyEquivalentAverage: Number((annualAverage / 12).toFixed(4)),
    mode: 'recent-payments' as DividendEstimateMode,
    lastDividendDate: dividends[dividends.length - 1].date,
  }
}

export function findEtfPreset(symbol: string): EtfPreset | undefined {
  const normalized = normalizeSymbol(symbol)
  return ETF_PRESETS.find((preset) => preset.symbol === normalized)
}

export async function fetchEtfSnapshot(
  symbol: string,
  fallbackCurrency: AssetCurrency = 'USD',
): Promise<EtfSnapshot> {
  const normalizedSymbol = normalizeSymbol(symbol)

  if (!VALID_SYMBOL_PATTERN.test(normalizedSymbol)) {
    throw new Error('티커는 영문, 숫자, 점, 하이픈만 사용할 수 있어.')
  }

  const response = await fetch(
    `/api/yahoo-chart?ticker=${encodeURIComponent(normalizedSymbol)}&range=max&interval=1mo`,
  )

  if (!response.ok) {
    throw new Error('ETF 가격 데이터를 불러오지 못했어.')
  }

  const data = (await response.json()) as YahooChartResponse
  const result = data.chart?.result?.[0]
  const apiError = data.chart?.error?.description

  if (!result) {
    throw new Error(apiError ?? 'ETF 가격 데이터가 비어 있어.')
  }

  const pricePoints = parsePricePoints(result)

  if (pricePoints.length < 2) {
    throw new Error('성장률을 계산할 만큼 가격 데이터가 충분하지 않아.')
  }

  const meta = result.meta
  const currency = meta?.currency
    ? asAssetCurrency(meta.currency)
    : fallbackCurrency
  const startPoint = pricePoints[0]
  const lastPoint = pricePoints[pricePoints.length - 1]
  const currentPrice = isFinitePositive(meta?.regularMarketPrice)
    ? meta.regularMarketPrice
    : lastPoint.close
  const currentDate = meta?.regularMarketTime
    ? toIsoDate(meta.regularMarketTime)
    : lastPoint.date
  const elapsedYears = yearsBetween(startPoint.date, currentDate)
  const totalGrowthRate = currentPrice / startPoint.close - 1
  const annualGrowthRate = Math.pow(currentPrice / startPoint.close, 1 / elapsedYears) - 1
  const monthlyGrowthRate = Math.pow(1 + annualGrowthRate, 1 / 12) - 1
  const dividends = parseDividends(result)
  const dividendEstimate = estimateDividend(dividends, currentDate)

  return {
    symbol: meta?.symbol ?? normalizedSymbol,
    name: meta?.longName ?? meta?.shortName ?? normalizedSymbol,
    currency,
    exchangeName: meta?.fullExchangeName ?? meta?.exchangeName ?? '',
    startDate: startPoint.date,
    currentDate,
    startPrice: roundPrice(startPoint.close, currency),
    currentPrice: roundPrice(currentPrice, currency),
    elapsedYears: Number(elapsedYears.toFixed(2)),
    totalGrowthRate,
    annualGrowthRate,
    monthlyGrowthRate,
    pricePoints,
    dividends,
    dividendFrequency: dividendEstimate.frequency,
    dividendPaymentMonths: dividendEstimate.paymentMonths,
    dividendPaymentsPerYear: dividendEstimate.paymentsPerYear,
    dividendPerPaymentMin: dividendEstimate.perPaymentMin,
    dividendPerPaymentMax: dividendEstimate.perPaymentMax,
    dividendPerPaymentAverage: dividendEstimate.perPaymentAverage,
    annualDividendAverage: dividendEstimate.annualAverage,
    monthlyDividendEquivalentAverage: dividendEstimate.monthlyEquivalentAverage,
    dividendEstimateMode: dividendEstimate.mode,
    lastDividendDate: dividendEstimate.lastDividendDate,
    source: 'Yahoo Finance chart',
    updatedAt: new Date().toISOString(),
  }
}
