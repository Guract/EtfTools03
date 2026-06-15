import {
  getDividendFrequencyLabel,
  getDividendPaymentMonthsLabel,
  getDividendPaymentUnitLabel,
} from '../lib/dividends'
import {
  formatGoalReach,
  formatKrw,
  formatMoney,
  formatPercent,
  formatShares,
  toKrw,
} from '../lib/formatters'
import type {
  EtfSnapshot,
  ExchangeRateInfo,
  ExchangeRateScenario,
  SimulationInputs,
  SimulationResult,
} from '../types'

interface SummaryCardsProps {
  inputs: SimulationInputs
  result: SimulationResult
  etfSnapshot: EtfSnapshot | null
  exchangeRateInfo: ExchangeRateInfo | null
  exchangeRateScenarios: ExchangeRateScenario[]
}

export function SummaryCards({
  inputs,
  result,
  etfSnapshot,
  exchangeRateInfo,
  exchangeRateScenarios,
}: SummaryCardsProps) {
  const primaryExchangeRate =
    exchangeRateScenarios.find((scenario) => scenario.key === 'average5y') ??
    exchangeRateScenarios[0]
  const finalDividendKrw = toKrw(
    result.finalRow.reinvestmentAnnualAfterTaxDividend,
    inputs.assetCurrency,
    primaryExchangeRate?.rate ?? 0,
  )
  const finalAssetKrw = toKrw(
    result.finalRow.reinvestmentTotalAssetValue,
    inputs.assetCurrency,
    primaryExchangeRate?.rate ?? 0,
  )
  const goalSummary = `재투자 ${formatGoalReach(
    result.targetReach.reinvestmentMonth,
    inputs.simulationYears,
  )} / 비재투자 ${formatGoalReach(
    result.targetReach.noReinvestmentMonth,
    inputs.simulationYears,
  )}`

  const cards = [
    {
      label: '자동 계산 CAGR',
      value: formatPercent(result.annualGrowthRate),
      tone: 'text-emerald-700',
    },
    {
      label: `평균 ${getDividendPaymentUnitLabel(inputs.dividendFrequency)} 배당`,
      value: formatMoney(
        result.averageDividendPerPayment,
        inputs.assetCurrency,
      ),
      tone: 'text-slate-950',
    },
    {
      label: '연 배당 환산',
      value: formatMoney(result.averageAnnualDividend, inputs.assetCurrency),
      tone: 'text-slate-950',
    },
    {
      label: '월 환산 배당',
      value: formatMoney(
        result.averageMonthlyEquivalentDividend,
        inputs.assetCurrency,
      ),
      tone: 'text-slate-950',
    },
    {
      label: '현재 보유 수량',
      value: `${formatShares(inputs.currentShares, inputs.reinvestmentMode)}주`,
      tone: 'text-slate-950',
    },
    {
      label: `${inputs.simulationYears}년 뒤 예상 보유 수량`,
      value: `${formatShares(
        result.finalRow.reinvestmentShares,
        inputs.reinvestmentMode,
      )}주`,
      tone: 'text-blue-700',
    },
    {
      label: '목표 수량 도달 예상',
      value: goalSummary,
      tone: 'text-slate-950',
    },
    {
      label: `${inputs.simulationYears}년 뒤 세후 1회 배당`,
      value: formatMoney(
        result.finalRow.reinvestmentPaymentAfterTaxDividend,
        inputs.assetCurrency,
      ),
      tone: 'text-emerald-700',
    },
    {
      label: `${inputs.simulationYears}년 뒤 세후 연 배당`,
      value: formatMoney(
        result.finalRow.reinvestmentAnnualAfterTaxDividend,
        inputs.assetCurrency,
      ),
      tone: 'text-emerald-700',
    },
    {
      label: `${inputs.simulationYears}년 뒤 총 평가금액`,
      value: formatMoney(
        result.finalRow.reinvestmentTotalAssetValue,
        inputs.assetCurrency,
      ),
      tone: 'text-slate-950',
    },
    {
      label: '배당 재투자로 늘어난 수량',
      value: `${formatShares(
        result.addedSharesFromReinvestment,
        inputs.reinvestmentMode,
      )}주`,
      tone:
        result.addedSharesFromReinvestment >= 0
          ? 'text-blue-700'
          : 'text-rose-700',
    },
    {
      label: '재투자 후 남은 현금',
      value: formatMoney(result.finalRow.reinvestmentCash, inputs.assetCurrency),
      tone: 'text-slate-950',
    },
  ]

  return (
    <section className="grid min-w-0 self-start gap-3 xl:grid-cols-2 2xl:grid-cols-3">
      <article className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          자동 조회 기준
        </p>
        {etfSnapshot ? (
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-700">조회 종목</span>
              <span className="text-right font-black text-slate-950">
                {etfSnapshot.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-700">처음값</span>
              <span className="text-right font-black text-slate-950">
                {formatMoney(etfSnapshot.startPrice, etfSnapshot.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-700">현재값</span>
              <span className="text-right font-black text-emerald-800">
                {formatMoney(etfSnapshot.currentPrice, etfSnapshot.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-700">배당 주기</span>
              <span className="text-right font-black text-slate-950">
                {getDividendFrequencyLabel(etfSnapshot.dividendFrequency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-700">지급월</span>
              <span className="text-right font-black text-slate-950">
                {getDividendPaymentMonthsLabel(
                  etfSnapshot.dividendFrequency,
                  etfSnapshot.dividendPaymentMonths,
                )}
              </span>
            </div>
            <p className="text-xs text-emerald-800">
              {etfSnapshot.source} · {etfSnapshot.startDate}~{etfSnapshot.currentDate}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm font-semibold text-slate-700">
            수기 입력값으로 계산 중
          </p>
        )}
      </article>

      <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          원화 환산
        </p>
        <div className="mt-3 grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-600">
              세후 연 배당
            </span>
            <span className="text-base font-black text-emerald-700">
              {finalDividendKrw === null ? '환율 필요' : formatKrw(finalDividendKrw)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-600">
              총 평가금액
            </span>
            <span className="text-base font-black text-slate-950">
              {finalAssetKrw === null ? '환율 필요' : formatKrw(finalAssetKrw)}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-slate-500">
          {inputs.assetCurrency === 'KRW'
            ? '국내 ETF라 원화 금액을 그대로 표시'
            : primaryExchangeRate
              ? `${primaryExchangeRate.label} ${primaryExchangeRate.rate.toLocaleString('ko-KR')}원 기준`
              : exchangeRateInfo
                ? `${exchangeRateInfo.source} 환율 기준`
                : '환율을 불러오면 원화 환산 가능'}
        </p>
      </article>

      {inputs.assetCurrency === 'USD' ? (
        <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            환율 시나리오
          </p>
          {exchangeRateScenarios.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {exchangeRateScenarios.map((scenario) => (
                <div
                  className="flex items-center justify-between gap-3"
                  key={scenario.key}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {scenario.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {scenario.description}
                    </p>
                  </div>
                  <p className="text-sm font-black text-emerald-800">
                    {scenario.rate.toLocaleString('ko-KR')}원
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-rose-700">
              환율 필요
            </p>
          )}
        </article>
      ) : null}

      {cards.map((card) => (
        <article
          className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          key={card.label}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {card.label}
          </p>
          <p
            className={`mt-2 overflow-wrap-anywhere text-xl font-bold leading-snug sm:text-2xl ${card.tone}`}
          >
            {card.value}
          </p>
        </article>
      ))}
    </section>
  )
}
