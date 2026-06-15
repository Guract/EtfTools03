import type { ExchangeRateInfo, ExchangeRateScenario } from '../types'

interface FrankfurterRate {
  date?: string
  base?: string
  quote?: string
  rate?: number
}

interface ExchangeRateApiResponse {
  result?: string
  provider?: string
  time_last_update_utc?: string
  rates?: {
    KRW?: number
  }
}

const FRANKFURTER_RANGE_URL = 'https://api.frankfurter.dev/v2/rates'
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD'

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getFiveYearsAgo(date: Date): Date {
  const fiveYearsAgo = new Date(date)
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
  return fiveYearsAgo
}

function isValidRate(rate: unknown): rate is number {
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0
}

export function getExchangeRateScenarios(
  rateInfo: ExchangeRateInfo | null,
  manualRate: number,
): ExchangeRateScenario[] {
  if (rateInfo?.fiveYear) {
    const currentRate = manualRate > 0 ? manualRate : rateInfo.rate
    const isManualCurrentRate = Math.abs(currentRate - rateInfo.rate) > 0.01

    return [
      {
        key: 'average5y',
        label: '5년 평균',
        rate: rateInfo.fiveYear.averageRate,
        description: `${rateInfo.fiveYear.startDate}~${rateInfo.fiveYear.endDate}`,
      },
      {
        key: 'current',
        label: '현재 환율',
        rate: currentRate,
        description: isManualCurrentRate ? '직접 입력값' : rateInfo.date,
      },
      {
        key: 'high5y',
        label: '5년 최고',
        rate: rateInfo.fiveYear.maxRate,
        description: rateInfo.fiveYear.maxDate,
      },
    ]
  }

  if (manualRate > 0) {
    return [
      {
        key: 'current',
        label: '입력 환율',
        rate: manualRate,
        description: '직접 입력값',
      },
    ]
  }

  return []
}

export async function fetchUsdKrwRate(): Promise<ExchangeRateInfo> {
  try {
    const today = new Date()
    const from = formatDate(getFiveYearsAgo(today))
    const to = formatDate(today)
    const response = await fetch(
      `${FRANKFURTER_RANGE_URL}?from=${from}&to=${to}&base=USD&quotes=KRW`,
    )

    if (!response.ok) {
      throw new Error('Frankfurter API request failed')
    }

    const data = (await response.json()) as FrankfurterRate[]
    const krwRates = Array.isArray(data)
      ? data.filter(
          (item) =>
            item.base === 'USD' && item.quote === 'KRW' && isValidRate(item.rate),
        )
      : []

    if (krwRates.length === 0) {
      throw new Error('Frankfurter API did not return USD/KRW')
    }

    const latestRate = krwRates[krwRates.length - 1]
    const minRate = krwRates.reduce((lowest, item) =>
      item.rate! < lowest.rate! ? item : lowest,
    )
    const maxRate = krwRates.reduce((highest, item) =>
      item.rate! > highest.rate! ? item : highest,
    )
    const averageRate =
      krwRates.reduce((sum, item) => sum + item.rate!, 0) / krwRates.length

    if (!isValidRate(latestRate?.rate)) {
      throw new Error('Frankfurter API did not return USD/KRW')
    }

    return {
      rate: latestRate.rate,
      source: 'Frankfurter',
      date: latestRate.date ?? to,
      updatedAt: new Date().toISOString(),
      fiveYear: {
        startDate: krwRates[0]?.date ?? from,
        endDate: latestRate.date ?? to,
        averageRate: Number(averageRate.toFixed(2)),
        minRate: minRate.rate!,
        minDate: minRate.date ?? from,
        maxRate: maxRate.rate!,
        maxDate: maxRate.date ?? to,
        sampleCount: krwRates.length,
      },
    }
  } catch {
    const response = await fetch(EXCHANGE_RATE_API_URL)

    if (!response.ok) {
      throw new Error('환율 API 응답을 가져오지 못했어.')
    }

    const data = (await response.json()) as ExchangeRateApiResponse
    const krwRate = data.rates?.KRW

    if (data.result !== 'success' || !isValidRate(krwRate)) {
      throw new Error('USD/KRW 환율 값이 응답에 없어.')
    }

    return {
      rate: krwRate,
      source: data.provider ?? 'ExchangeRate-API',
      date: data.time_last_update_utc ?? new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    }
  }
}
