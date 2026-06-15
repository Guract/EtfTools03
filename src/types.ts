export type ReinvestmentMode = 'integer' | 'fractional'
export type ExchangeRateScenarioKey = 'average5y' | 'current' | 'high5y'
export type AssetCurrency = 'USD' | 'KRW'
export type DividendFrequency =
  | 'none'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'irregular'
export type DividendEstimateMode =
  | 'none'
  | 'recent-payments'
  | 'annualized-payments'

export interface SimulationInputs {
  etfName: string
  ticker: string
  assetCurrency: AssetCurrency
  startPrice: number
  currentPrice: number
  elapsedYears: number
  currentShares: number
  monthlyPurchaseShares: number
  dividendFrequency: DividendFrequency
  dividendPaymentMonths: number[]
  dividendPerPaymentMin: number
  dividendPerPaymentMax: number
  simulationStartMonth: number
  taxRate: number
  usdKrwRate: number
  simulationYears: number
  targetShares: number
  reinvestmentMode: ReinvestmentMode
}

export interface TargetReach {
  reinvestmentMonth: number | null
  noReinvestmentMonth: number | null
}

export interface YearlySimulationRow {
  year: number
  etfPrice: number
  reinvestmentShares: number
  reinvestmentPaymentPreTaxDividend: number
  reinvestmentPaymentAfterTaxDividend: number
  reinvestmentAnnualPreTaxDividend: number
  reinvestmentAnnualAfterTaxDividend: number
  reinvestmentMonthlyEquivalentPreTaxDividend: number
  reinvestmentMonthlyEquivalentAfterTaxDividend: number
  reinvestmentCumulativeDividend: number
  reinvestmentCash: number
  reinvestmentMarketValue: number
  reinvestmentTotalAssetValue: number
  noReinvestmentShares: number
  noReinvestmentPaymentPreTaxDividend: number
  noReinvestmentPaymentAfterTaxDividend: number
  noReinvestmentAnnualPreTaxDividend: number
  noReinvestmentAnnualAfterTaxDividend: number
  noReinvestmentMonthlyEquivalentPreTaxDividend: number
  noReinvestmentMonthlyEquivalentAfterTaxDividend: number
  noReinvestmentCumulativeCashDividend: number
  noReinvestmentMarketValue: number
  noReinvestmentTotalAssetValue: number
  totalAssetDifference: number
  shareDifference: number
  isReinvestmentTargetYear: boolean
  isNoReinvestmentTargetYear: boolean
}

export interface SimulationResult {
  averageDividendPerPayment: number
  averageAnnualDividend: number
  averageMonthlyEquivalentDividend: number
  annualGrowthRate: number
  monthlyGrowthRate: number
  targetReach: TargetReach
  yearlyRows: YearlySimulationRow[]
  finalRow: YearlySimulationRow
  addedSharesFromReinvestment: number
}

export interface ExchangeRateInfo {
  rate: number
  source: string
  date: string
  updatedAt: string
  fiveYear?: {
    startDate: string
    endDate: string
    averageRate: number
    minRate: number
    minDate: string
    maxRate: number
    maxDate: string
    sampleCount: number
  }
}

export interface ExchangeRateScenario {
  key: ExchangeRateScenarioKey
  label: string
  rate: number
  description: string
}

export interface EtfPreset {
  symbol: string
  name: string
  market: 'US' | 'KR'
  currency: AssetCurrency
  category: string
  note: string
}

export interface EtfPricePoint {
  date: string
  close: number
}

export interface EtfDividendPoint {
  date: string
  amount: number
}

export interface EtfSnapshot {
  symbol: string
  name: string
  currency: AssetCurrency
  exchangeName: string
  startDate: string
  currentDate: string
  startPrice: number
  currentPrice: number
  elapsedYears: number
  totalGrowthRate: number
  annualGrowthRate: number
  monthlyGrowthRate: number
  pricePoints: EtfPricePoint[]
  dividends: EtfDividendPoint[]
  dividendFrequency: DividendFrequency
  dividendPaymentMonths: number[]
  dividendPaymentsPerYear: number
  dividendPerPaymentMin: number
  dividendPerPaymentMax: number
  dividendPerPaymentAverage: number
  annualDividendAverage: number
  monthlyDividendEquivalentAverage: number
  dividendEstimateMode: DividendEstimateMode
  lastDividendDate: string | null
  source: string
  updatedAt: string
}
