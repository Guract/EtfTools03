import type {
  SimulationInputs,
  SimulationResult,
  TargetReach,
  YearlySimulationRow,
} from '../types'
import {
  getDefaultDividendPaymentMonths,
  getDividendPaymentsPerYear,
  isDividendPaymentMonth,
} from './dividends'

export const SAMPLE_INPUTS: SimulationInputs = {
  etfName: 'Invesco QQQ Trust Series 1',
  ticker: 'QQQ',
  assetCurrency: 'USD',
  startPrice: 88.29,
  currentPrice: 462.65,
  elapsedYears: 10,
  currentShares: 100,
  monthlyPurchaseShares: 10,
  dividendFrequency: 'quarterly',
  dividendPaymentMonths: getDefaultDividendPaymentMonths('quarterly'),
  dividendPerPaymentMin: 0.43,
  dividendPerPaymentMax: 0.76,
  simulationStartMonth: new Date().getMonth() + 1,
  taxRate: 15,
  usdKrwRate: 0,
  simulationYears: 20,
  targetShares: 1000,
  reinvestmentMode: 'integer',
}

export const EMPTY_INPUTS: SimulationInputs = {
  etfName: '',
  ticker: '',
  assetCurrency: 'USD',
  startPrice: 0,
  currentPrice: 0,
  elapsedYears: 1,
  currentShares: 0,
  monthlyPurchaseShares: 0,
  dividendFrequency: 'monthly',
  dividendPaymentMonths: getDefaultDividendPaymentMonths('monthly'),
  dividendPerPaymentMin: 0,
  dividendPerPaymentMax: 0,
  simulationStartMonth: new Date().getMonth() + 1,
  taxRate: 15,
  usdKrwRate: 0,
  simulationYears: 30,
  targetShares: 1200,
  reinvestmentMode: 'integer',
}

export function validateInputs(inputs: SimulationInputs): string[] {
  const errors: string[] = []

  if (!inputs.etfName.trim()) {
    errors.push('ETF 이름을 입력해줘.')
  }

  if (!inputs.ticker.trim()) {
    errors.push('ETF 티커를 입력해줘.')
  }

  if (inputs.startPrice <= 0) {
    errors.push('처음값은 0보다 커야 해.')
  }

  if (inputs.currentPrice <= 0) {
    errors.push('현재값은 0보다 커야 해.')
  }

  if (inputs.elapsedYears <= 0) {
    errors.push('경과연수는 0보다 커야 CAGR을 계산할 수 있어.')
  }

  if (inputs.currentShares < 0) {
    errors.push('현재 보유 수량은 음수가 될 수 없어.')
  }

  if (inputs.monthlyPurchaseShares < 0) {
    errors.push('매월 추가 매수 수량은 음수가 될 수 없어.')
  }

  if (inputs.dividendPerPaymentMin < 0 || inputs.dividendPerPaymentMax < 0) {
    errors.push('1회 배당금은 음수가 될 수 없어.')
  }

  if (inputs.dividendPerPaymentMax < inputs.dividendPerPaymentMin) {
    errors.push('1회 배당금 최대값은 최소값보다 크거나 같아야 해.')
  }

  if (
    !Number.isInteger(inputs.simulationStartMonth) ||
    inputs.simulationStartMonth < 1 ||
    inputs.simulationStartMonth > 12
  ) {
    errors.push('계산 시작월은 1월부터 12월 사이여야 해.')
  }

  if (inputs.taxRate < 0 || inputs.taxRate > 100) {
    errors.push('배당세율은 0%부터 100% 사이로 입력해줘.')
  }

  if (inputs.usdKrwRate < 0) {
    errors.push('환율은 음수가 될 수 없어.')
  }

  if (
    !Number.isInteger(inputs.simulationYears) ||
    inputs.simulationYears < 1 ||
    inputs.simulationYears > 30
  ) {
    errors.push('시뮬레이션 기간은 1년부터 30년까지 선택해줘.')
  }

  if (inputs.targetShares <= 0) {
    errors.push('목표 수량은 0보다 커야 해.')
  }

  return errors
}

export function calculateSimulation(inputs: SimulationInputs): SimulationResult {
  const paymentsPerYear = getDividendPaymentsPerYear(
    inputs.dividendFrequency,
    inputs.dividendPaymentMonths,
  )
  const averageDividendPerPayment =
    (inputs.dividendPerPaymentMin + inputs.dividendPerPaymentMax) / 2
  const averageAnnualDividend = averageDividendPerPayment * paymentsPerYear
  const averageMonthlyEquivalentDividend = averageAnnualDividend / 12
  const annualGrowthRate =
    Math.pow(inputs.currentPrice / inputs.startPrice, 1 / inputs.elapsedYears) -
    1
  const monthlyGrowthRate = Math.pow(1 + annualGrowthRate, 1 / 12) - 1
  const afterTaxRate = 1 - inputs.taxRate / 100

  const targetReach: TargetReach = {
    reinvestmentMonth: inputs.currentShares >= inputs.targetShares ? 0 : null,
    noReinvestmentMonth: inputs.currentShares >= inputs.targetShares ? 0 : null,
  }

  let etfPrice = inputs.currentPrice
  let reinvestmentShares = inputs.currentShares
  let noReinvestmentShares = inputs.currentShares
  let reinvestmentCash = 0
  let reinvestmentCumulativeDividend = 0
  let noReinvestmentCumulativeCashDividend = 0
  const yearlyRows: YearlySimulationRow[] = []

  for (let month = 1; month <= inputs.simulationYears * 12; month += 1) {
    etfPrice *= 1 + monthlyGrowthRate

    reinvestmentShares += inputs.monthlyPurchaseShares
    noReinvestmentShares += inputs.monthlyPurchaseShares

    const calendarMonth =
      ((inputs.simulationStartMonth - 1 + month) % 12) + 1
    const hasDividendPayment = isDividendPaymentMonth(
      inputs.dividendFrequency,
      inputs.dividendPaymentMonths,
      calendarMonth,
    )
    const reinvestmentPaymentPreTaxDividend = hasDividendPayment
      ? reinvestmentShares * averageDividendPerPayment
      : 0
    const reinvestmentPaymentAfterTaxDividend =
      reinvestmentPaymentPreTaxDividend * afterTaxRate

    reinvestmentCumulativeDividend += reinvestmentPaymentAfterTaxDividend
    reinvestmentCash += reinvestmentPaymentAfterTaxDividend

    if (inputs.reinvestmentMode === 'integer') {
      const purchasableShares = Math.floor(reinvestmentCash / etfPrice)
      if (purchasableShares > 0) {
        reinvestmentShares += purchasableShares
        reinvestmentCash -= purchasableShares * etfPrice
      }
    } else if (reinvestmentCash > 0) {
      reinvestmentShares += reinvestmentCash / etfPrice
      reinvestmentCash = 0
    }

    const noReinvestmentPaymentPreTaxDividend = hasDividendPayment
      ? noReinvestmentShares * averageDividendPerPayment
      : 0
    const noReinvestmentPaymentAfterTaxDividend =
      noReinvestmentPaymentPreTaxDividend * afterTaxRate

    noReinvestmentCumulativeCashDividend += noReinvestmentPaymentAfterTaxDividend

    if (
      targetReach.reinvestmentMonth === null &&
      reinvestmentShares >= inputs.targetShares
    ) {
      targetReach.reinvestmentMonth = month
    }

    if (
      targetReach.noReinvestmentMonth === null &&
      noReinvestmentShares >= inputs.targetShares
    ) {
      targetReach.noReinvestmentMonth = month
    }

    if (month % 12 === 0) {
      const year = month / 12
      const reinvestmentYearEndPaymentPreTaxDividend =
        reinvestmentShares * averageDividendPerPayment
      const reinvestmentYearEndPaymentAfterTaxDividend =
        reinvestmentYearEndPaymentPreTaxDividend * afterTaxRate
      const reinvestmentYearEndAnnualPreTaxDividend =
        reinvestmentShares * averageAnnualDividend
      const reinvestmentYearEndAnnualAfterTaxDividend =
        reinvestmentYearEndAnnualPreTaxDividend * afterTaxRate
      const noReinvestmentYearEndPaymentPreTaxDividend =
        noReinvestmentShares * averageDividendPerPayment
      const noReinvestmentYearEndPaymentAfterTaxDividend =
        noReinvestmentYearEndPaymentPreTaxDividend * afterTaxRate
      const noReinvestmentYearEndAnnualPreTaxDividend =
        noReinvestmentShares * averageAnnualDividend
      const noReinvestmentYearEndAnnualAfterTaxDividend =
        noReinvestmentYearEndAnnualPreTaxDividend * afterTaxRate
      const reinvestmentMarketValue = reinvestmentShares * etfPrice
      const noReinvestmentMarketValue = noReinvestmentShares * etfPrice
      const reinvestmentTotalAssetValue =
        reinvestmentMarketValue + reinvestmentCash
      const noReinvestmentTotalAssetValue =
        noReinvestmentMarketValue + noReinvestmentCumulativeCashDividend

      yearlyRows.push({
        year,
        etfPrice,
        reinvestmentShares,
        reinvestmentPaymentPreTaxDividend:
          reinvestmentYearEndPaymentPreTaxDividend,
        reinvestmentPaymentAfterTaxDividend:
          reinvestmentYearEndPaymentAfterTaxDividend,
        reinvestmentAnnualPreTaxDividend:
          reinvestmentYearEndAnnualPreTaxDividend,
        reinvestmentAnnualAfterTaxDividend:
          reinvestmentYearEndAnnualAfterTaxDividend,
        reinvestmentMonthlyEquivalentPreTaxDividend:
          reinvestmentYearEndAnnualPreTaxDividend / 12,
        reinvestmentMonthlyEquivalentAfterTaxDividend:
          reinvestmentYearEndAnnualAfterTaxDividend / 12,
        reinvestmentCumulativeDividend,
        reinvestmentCash,
        reinvestmentMarketValue,
        reinvestmentTotalAssetValue,
        noReinvestmentShares,
        noReinvestmentPaymentPreTaxDividend:
          noReinvestmentYearEndPaymentPreTaxDividend,
        noReinvestmentPaymentAfterTaxDividend:
          noReinvestmentYearEndPaymentAfterTaxDividend,
        noReinvestmentAnnualPreTaxDividend:
          noReinvestmentYearEndAnnualPreTaxDividend,
        noReinvestmentAnnualAfterTaxDividend:
          noReinvestmentYearEndAnnualAfterTaxDividend,
        noReinvestmentMonthlyEquivalentPreTaxDividend:
          noReinvestmentYearEndAnnualPreTaxDividend / 12,
        noReinvestmentMonthlyEquivalentAfterTaxDividend:
          noReinvestmentYearEndAnnualAfterTaxDividend / 12,
        noReinvestmentCumulativeCashDividend,
        noReinvestmentMarketValue,
        noReinvestmentTotalAssetValue,
        totalAssetDifference:
          reinvestmentTotalAssetValue - noReinvestmentTotalAssetValue,
        shareDifference: reinvestmentShares - noReinvestmentShares,
        isReinvestmentTargetYear:
          targetReach.reinvestmentMonth !== null &&
          targetReach.reinvestmentMonth > (year - 1) * 12 &&
          targetReach.reinvestmentMonth <= year * 12,
        isNoReinvestmentTargetYear:
          targetReach.noReinvestmentMonth !== null &&
          targetReach.noReinvestmentMonth > (year - 1) * 12 &&
          targetReach.noReinvestmentMonth <= year * 12,
      })
    }
  }

  const finalRow = yearlyRows[yearlyRows.length - 1]

  return {
    averageDividendPerPayment,
    averageAnnualDividend,
    averageMonthlyEquivalentDividend,
    annualGrowthRate,
    monthlyGrowthRate,
    targetReach,
    yearlyRows,
    finalRow,
    addedSharesFromReinvestment:
      finalRow.reinvestmentShares - finalRow.noReinvestmentShares,
  }
}
