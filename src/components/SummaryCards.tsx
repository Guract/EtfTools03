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

interface MetricCard {
  label: string
  value: string
  helper?: string
  tone: string
}

function InfoStat({
  label,
  value,
  tone = 'text-slate-950',
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="min-w-0 border-t border-slate-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-1 overflow-wrap-anywhere text-lg font-black ${tone}`}>
        {value}
      </p>
    </div>
  )
}

function MetricTile({ label, value, helper, tone }: MetricCard) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-2 overflow-wrap-anywhere text-xl font-black ${tone}`}>
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </article>
  )
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
  const symbol = etfSnapshot?.symbol ?? inputs.ticker.trim() ?? 'ETF'
  const displaySymbol = symbol || 'ETF'
  const displayName = etfSnapshot?.name ?? inputs.etfName
  const displayCurrency = etfSnapshot?.currency ?? inputs.assetCurrency
  const displayFrequency =
    etfSnapshot?.dividendFrequency ?? inputs.dividendFrequency
  const displayPaymentMonths =
    etfSnapshot?.dividendPaymentMonths ?? inputs.dividendPaymentMonths
  const dividendModeLabel = etfSnapshot
    ? etfSnapshot.dividendEstimateMode === 'recent-payments'
      ? `${getDividendFrequencyLabel(displayFrequency)} 감지`
      : '배당 이력 없음'
    : `${getDividendFrequencyLabel(displayFrequency)} 설정`
  const basisDate = etfSnapshot?.currentDate ?? '수기 입력'
  const startPrice = etfSnapshot?.startPrice ?? inputs.startPrice
  const currentPrice = etfSnapshot?.currentPrice ?? inputs.currentPrice
  const elapsedYears = etfSnapshot?.elapsedYears ?? inputs.elapsedYears
  const annualGrowthRate =
    etfSnapshot?.annualGrowthRate ?? result.annualGrowthRate
  const dividendPerPayment =
    etfSnapshot?.dividendPerPaymentAverage ?? result.averageDividendPerPayment
  const annualDividend =
    etfSnapshot?.annualDividendAverage ?? result.averageAnnualDividend
  const monthlyDividend =
    etfSnapshot?.monthlyDividendEquivalentAverage ??
    result.averageMonthlyEquivalentDividend

  const metrics: MetricCard[] = [
    {
      label: '자동 계산 CAGR',
      value: formatPercent(result.annualGrowthRate),
      helper: etfSnapshot
        ? `${etfSnapshot.startDate}~${etfSnapshot.currentDate}`
        : '입력 가격 기준',
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
      label: `${inputs.simulationYears}년 후 예상 수량`,
      value: `${formatShares(
        result.finalRow.reinvestmentShares,
        inputs.reinvestmentMode,
      )}주`,
      tone: 'text-[#0b56a5]',
    },
    {
      label: '목표 수량 도달',
      value: goalSummary,
      tone: 'text-slate-950',
    },
    {
      label: `${inputs.simulationYears}년 후 세후 1회 배당`,
      value: formatMoney(
        result.finalRow.reinvestmentPaymentAfterTaxDividend,
        inputs.assetCurrency,
      ),
      helper: `${getDividendPaymentMonthsLabel(
        inputs.dividendFrequency,
        inputs.dividendPaymentMonths,
      )} 지급 기준`,
      tone: 'text-emerald-700',
    },
    {
      label: `${inputs.simulationYears}년 후 세후 연 배당`,
      value: formatMoney(
        result.finalRow.reinvestmentAnnualAfterTaxDividend,
        inputs.assetCurrency,
      ),
      tone: 'text-emerald-700',
    },
    {
      label: `${inputs.simulationYears}년 후 총 평가금액`,
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
          ? 'text-emerald-700'
          : 'text-rose-700',
    },
    {
      label: '재투자 후 남은 현금',
      value: formatMoney(result.finalRow.reinvestmentCash, inputs.assetCurrency),
      tone: 'text-slate-950',
    },
  ]

  return (
    <section className="grid min-w-0 gap-4">
      <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-[#0b2d5c]">
              자동 조회 결과
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              기준일: {basisDate}
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {etfSnapshot ? etfSnapshot.source : '수기 입력값'}
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid min-w-0 gap-4 p-4 lg:grid-cols-[minmax(210px,1.25fr)_repeat(4,minmax(116px,0.75fr))] lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#063a78] text-base font-black text-white shadow-inner">
                {displaySymbol.slice(0, 4).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                  {displayName || displaySymbol}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {etfSnapshot
                    ? `${etfSnapshot.exchangeName} · ${displayCurrency} · ETF`
                    : `${displayCurrency} · 직접 입력`}
                </p>
              </div>
            </div>

            <InfoStat
              label={`처음값${etfSnapshot ? ` (${etfSnapshot.startDate})` : ''}`}
              value={formatMoney(startPrice, displayCurrency)}
            />
            <InfoStat
              label={`현재값${etfSnapshot ? ` (${etfSnapshot.currentDate})` : ''}`}
              value={formatMoney(currentPrice, displayCurrency)}
            />
            <InfoStat label="경과연수" value={`${elapsedYears.toFixed(2)}년`} />
            <InfoStat
              label="CAGR"
              value={formatPercent(annualGrowthRate)}
              tone="text-emerald-700"
            />
          </div>

          <div className="grid gap-4 border-t border-blue-100 bg-blue-50/70 p-4 lg:grid-cols-[1.1fr_1fr_repeat(3,minmax(120px,0.75fr))] lg:items-center">
            <div>
              <p className="text-xs font-black text-blue-700">
                배당 주기 감지 결과
              </p>
              <p className="mt-1 text-lg font-black text-[#0b56a5]">
                {dividendModeLabel}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">지급월</p>
              <p className="mt-1 text-base font-black text-[#0b2d5c]">
                {getDividendPaymentMonthsLabel(
                  displayFrequency,
                  displayPaymentMonths,
                )}
              </p>
            </div>
            <InfoStat
              label={`평균 ${getDividendPaymentUnitLabel(displayFrequency)} 배당`}
              value={formatMoney(dividendPerPayment, displayCurrency)}
            />
            <InfoStat
              label="연 배당 환산"
              value={formatMoney(annualDividend, displayCurrency)}
            />
            <InfoStat
              label="월 환산 배당"
              value={formatMoney(monthlyDividend, displayCurrency)}
            />
          </div>
        </div>
      </article>

      <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-[#0b2d5c]">
              시뮬레이션 요약
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              {inputs.simulationYears}년 후 예상 기준
            </p>
          </div>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metrics.map((metric) => (
            <MetricTile {...metric} key={metric.label} />
          ))}
        </div>
      </article>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-black text-[#0b2d5c]">원화 환산</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500">세후 연 배당</p>
              <p className="mt-1 overflow-wrap-anywhere text-lg font-black text-emerald-700">
                {finalDividendKrw === null ? '환율 필요' : formatKrw(finalDividendKrw)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500">총 평가금액</p>
              <p className="mt-1 overflow-wrap-anywhere text-lg font-black text-slate-950">
                {finalAssetKrw === null ? '환율 필요' : formatKrw(finalAssetKrw)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {inputs.assetCurrency === 'KRW'
              ? '국내 ETF라 원화 금액을 그대로 표시해.'
              : primaryExchangeRate
                ? `${primaryExchangeRate.label} ${primaryExchangeRate.rate.toLocaleString('ko-KR')}원 기준`
                : exchangeRateInfo
                  ? `${exchangeRateInfo.source} 환율 기준`
                  : '환율을 불러오면 원화 환산도 같이 보여줄 수 있어.'}
          </p>
        </article>

        {inputs.assetCurrency === 'USD' ? (
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-[#0b2d5c]">환율 시나리오</p>
              {exchangeRateInfo ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  {exchangeRateInfo.date}
                </span>
              ) : null}
            </div>
            {exchangeRateScenarios.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {exchangeRateScenarios.map((scenario) => (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
                    key={scenario.key}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950">
                        {scenario.label}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {scenario.description}
                      </p>
                    </div>
                    <p className="text-sm font-black text-emerald-700">
                      {scenario.rate.toLocaleString('ko-KR')}원
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">
                환율 필요
              </p>
            )}
          </article>
        ) : null}
      </div>
    </section>
  )
}
