import type { ReactNode } from 'react'
import { ETF_PRESETS, findEtfPreset } from '../lib/etfData'
import {
  DIVIDEND_FREQUENCY_OPTIONS,
  getDefaultDividendPaymentMonths,
  getDividendFrequencyLabel,
  getDividendPaymentMonthsLabel,
  getDividendPaymentUnitLabel,
  getDividendPaymentsPerYear,
} from '../lib/dividends'
import {
  formatMoney,
  formatPercent,
  formatUsd,
} from '../lib/formatters'
import type {
  AssetCurrency,
  DividendFrequency,
  EtfSnapshot,
  ExchangeRateInfo,
  ReinvestmentMode,
  SimulationInputs,
} from '../types'

interface InputFormProps {
  inputs: SimulationInputs
  onChange: (inputs: SimulationInputs) => void
  onCalculate: () => void
  isCalculationFeedbackActive: boolean
  onLoadExample: () => void
  onReset: () => void
  onCurrencyChange: (currency: AssetCurrency) => void
  onSelectPreset: (symbol: string) => void
  onFetchEtfData: () => void
  onFetchExchangeRate: () => void
  etfSnapshot: EtfSnapshot | null
  etfError: string | null
  isEtfLoading: boolean
  isEtfFetchFeedbackActive: boolean
  exchangeRateInfo: ExchangeRateInfo | null
  exchangeRateError: string | null
  isExchangeRateLoading: boolean
}

interface NumberControlProps {
  label: string
  value: number
  min: number
  max?: number
  step: number
  suffix: string
  helper?: string
  onChange: (value: string) => void
}

const simulationYearOptions = Array.from({ length: 30 }, (_, index) => index + 1)
const marketLabels = {
  US: '해외 ETF',
  KR: '국내 ETF',
}

const inputClass =
  'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'

function getDividendModeLabel(snapshot: EtfSnapshot): string {
  if (snapshot.dividendEstimateMode === 'recent-payments') {
    return `${getDividendFrequencyLabel(snapshot.dividendFrequency)} 감지`
  }

  return '배당 이력 없음'
}

function PanelSection({
  index,
  title,
  children,
}: {
  index: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-sm font-black text-[#0b2d5c]">
        {index}. {title}
      </h3>
      {children}
    </section>
  )
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  helper,
  onChange,
}: NumberControlProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <div className="flex h-10 overflow-hidden rounded-md border border-slate-200 bg-white transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
        <input
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-950 outline-none"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="flex min-w-12 items-center justify-center border-l border-slate-200 px-2 text-xs font-bold text-slate-500">
          {suffix}
        </span>
      </div>
      {helper ? <span className="text-xs leading-5 text-slate-400">{helper}</span> : null}
    </label>
  )
}

function MiniMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-md bg-slate-50 px-2.5 py-2 text-center">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 overflow-wrap-anywhere text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  )
}

export function InputForm({
  inputs,
  onChange,
  onCalculate,
  isCalculationFeedbackActive,
  onLoadExample,
  onReset,
  onCurrencyChange,
  onSelectPreset,
  onFetchEtfData,
  onFetchExchangeRate,
  etfSnapshot,
  etfError,
  isEtfLoading,
  isEtfFetchFeedbackActive,
  exchangeRateInfo,
  exchangeRateError,
  isExchangeRateLoading,
}: InputFormProps) {
  const selectedPreset = findEtfPreset(inputs.ticker)
  const averageDividendPerPayment =
    (inputs.dividendPerPaymentMin + inputs.dividendPerPaymentMax) / 2
  const dividendPaymentsPerYear = getDividendPaymentsPerYear(
    inputs.dividendFrequency,
    inputs.dividendPaymentMonths,
  )
  const averageAnnualDividend = averageDividendPerPayment * dividendPaymentsPerYear
  const averageMonthlyDividend = averageAnnualDividend / 12

  const updateNumber = (
    key: keyof Pick<
      SimulationInputs,
      | 'startPrice'
      | 'currentPrice'
      | 'elapsedYears'
      | 'currentShares'
      | 'monthlyPurchaseShares'
      | 'dividendPerPaymentMin'
      | 'dividendPerPaymentMax'
      | 'taxRate'
      | 'usdKrwRate'
      | 'targetShares'
    >,
    value: string,
  ) => {
    onChange({
      ...inputs,
      [key]: Number(value),
    })
  }

  const updateMode = (mode: ReinvestmentMode) => {
    onChange({
      ...inputs,
      reinvestmentMode: mode,
    })
  }

  const updateDividendFrequency = (frequency: DividendFrequency) => {
    onChange({
      ...inputs,
      dividendFrequency: frequency,
      dividendPaymentMonths: getDefaultDividendPaymentMonths(frequency),
    })
  }

  return (
    <form
      className="min-w-0 self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:p-5 lg:sticky lg:top-24"
      onSubmit={(event) => {
        event.preventDefault()
        onCalculate()
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-emerald-700">입력 패널</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            ETF 조건 설정
          </h2>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          자동 감지
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <PanelSection index="1" title="ETF 선택 및 기본 정보">
          <div className="grid min-w-0 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-600">프리셋 선택</span>
              <select
                className={inputClass}
                value={selectedPreset?.symbol ?? ''}
                onChange={(event) => onSelectPreset(event.target.value)}
              >
                <option value="">직접 입력</option>
                {(['US', 'KR'] as const).map((market) => (
                  <optgroup label={marketLabels[market]} key={market}>
                    {ETF_PRESETS.filter((preset) => preset.market === market).map(
                      (preset) => (
                        <option value={preset.symbol} key={preset.symbol}>
                          {preset.symbol} · {preset.category}
                        </option>
                      ),
                    )}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-3">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-600">
                  또는 티커 입력
                </span>
                <input
                  className={`${inputClass} font-black uppercase`}
                  value={inputs.ticker}
                  onChange={(event) =>
                    onChange({
                      ...inputs,
                      ticker: event.target.value.toUpperCase(),
                    })
                  }
                  placeholder="QQQ"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-600">통화</span>
                <select
                  className={inputClass}
                  value={inputs.assetCurrency}
                  onChange={(event) =>
                    onCurrencyChange(event.target.value as AssetCurrency)
                  }
                >
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-600">ETF 이름</span>
              <input
                className={`${inputClass} font-semibold`}
                value={inputs.etfName}
                onChange={(event) =>
                  onChange({ ...inputs, etfName: event.target.value })
                }
                placeholder="Invesco QQQ Trust Series 1"
              />
            </label>

            <div className="grid gap-3">
              <NumberControl
                label="처음값"
                value={inputs.startPrice}
                min={0}
                step={0.01}
                suffix={inputs.assetCurrency === 'KRW' ? '원' : '$'}
                onChange={(value) => updateNumber('startPrice', value)}
              />
              <NumberControl
                label="현재값"
                value={inputs.currentPrice}
                min={0}
                step={0.01}
                suffix={inputs.assetCurrency === 'KRW' ? '원' : '$'}
                onChange={(value) => updateNumber('currentPrice', value)}
              />
              <NumberControl
                label="경과연수"
                value={inputs.elapsedYears}
                min={0}
                step={0.01}
                suffix="년"
                onChange={(value) => updateNumber('elapsedYears', value)}
              />
            </div>

            <button
              className={`data-fetch-button relative h-10 overflow-hidden rounded-md px-4 text-sm font-black text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70 ${
                isEtfFetchFeedbackActive
                  ? 'data-fetch-button--confirmed bg-emerald-600'
                  : 'bg-emerald-600'
              }`}
              type="button"
              onClick={onFetchEtfData}
              disabled={isEtfLoading}
              aria-live="polite"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isEtfLoading
                      ? 'data-fetch-loading-dot bg-white'
                      : isEtfFetchFeedbackActive
                        ? 'data-fetch-feedback-dot bg-white'
                        : 'bg-emerald-200'
                  }`}
                  aria-hidden="true"
                />
                {isEtfLoading
                  ? '자동 조회 중...'
                  : isEtfFetchFeedbackActive
                    ? '조회 반영 완료'
                    : 'ETF 데이터 자동 조회'}
              </span>
            </button>
            <p
              className={`min-h-5 text-center text-xs font-bold transition ${
                isEtfFetchFeedbackActive
                  ? 'text-emerald-700 opacity-100'
                  : 'text-transparent opacity-0'
              }`}
            >
              가격과 배당 정보를 입력값에 반영했어.
            </p>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
              {etfSnapshot ? (
                <>
                  <span className="font-black text-slate-900">
                    {etfSnapshot.symbol}
                  </span>
                  {' · '}
                  {etfSnapshot.startDate} 처음값{' '}
                  {formatMoney(etfSnapshot.startPrice, etfSnapshot.currency)} →{' '}
                  {etfSnapshot.currentDate} 현재값{' '}
                  {formatMoney(etfSnapshot.currentPrice, etfSnapshot.currency)}
                  <span className="block">
                    CAGR {formatPercent(etfSnapshot.annualGrowthRate)} ·{' '}
                    {getDividendModeLabel(etfSnapshot)}{' '}
                    {formatMoney(
                      etfSnapshot.dividendPerPaymentAverage,
                      etfSnapshot.currency,
                    )}{' '}
                    / 1회
                  </span>
                </>
              ) : etfError ? (
                <span className="font-bold text-rose-700">{etfError}</span>
              ) : (
                '프리셋을 고르거나 티커를 입력하면 가격과 배당 추정치를 채울 수 있어.'
              )}
            </div>
          </div>
        </PanelSection>

        <PanelSection index="2" title="배당 정보">
          <div className="grid min-w-0 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-600">
                배당 주기
              </span>
              <select
                className={inputClass}
                value={inputs.dividendFrequency}
                onChange={(event) =>
                  updateDividendFrequency(event.target.value as DividendFrequency)
                }
              >
                {DIVIDEND_FREQUENCY_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black text-blue-700">
                  지급월
                </span>
                <span className="text-sm font-black text-[#0b2d5c]">
                  {getDividendPaymentMonthsLabel(
                    inputs.dividendFrequency,
                    inputs.dividendPaymentMonths,
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-blue-700">
                입력 배당금 기준은 {getDividendPaymentUnitLabel(
                  inputs.dividendFrequency,
                )}
                이야.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberControl
                label="1회 배당 최소"
                value={inputs.dividendPerPaymentMin}
                min={0}
                step={0.0001}
                suffix={inputs.assetCurrency === 'KRW' ? '원' : '$'}
                helper="최근 지급액 기준"
                onChange={(value) => updateNumber('dividendPerPaymentMin', value)}
              />
              <NumberControl
                label="1회 배당 최대"
                value={inputs.dividendPerPaymentMax}
                min={0}
                step={0.0001}
                suffix={inputs.assetCurrency === 'KRW' ? '원' : '$'}
                helper="분기 ETF는 분기 1회"
                onChange={(value) => updateNumber('dividendPerPaymentMax', value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MiniMetric
                label="평균 1회 배당"
                value={formatMoney(averageDividendPerPayment, inputs.assetCurrency)}
              />
              <MiniMetric
                label="연 배당 환산"
                value={formatMoney(averageAnnualDividend, inputs.assetCurrency)}
              />
              <MiniMetric
                label="월 환산 배당"
                value={formatMoney(averageMonthlyDividend, inputs.assetCurrency)}
              />
            </div>
          </div>
        </PanelSection>

        <PanelSection index="3" title="시뮬레이션 입력">
          <div className="grid min-w-0 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <NumberControl
                label="현재 보유 수량"
                value={inputs.currentShares}
                min={0}
                step={0.01}
                suffix="주"
                onChange={(value) => updateNumber('currentShares', value)}
              />
              <NumberControl
                label="매월 추가 매수"
                value={inputs.monthlyPurchaseShares}
                min={0}
                step={0.01}
                suffix="주"
                onChange={(value) =>
                  updateNumber('monthlyPurchaseShares', value)
                }
              />
              <NumberControl
                label="세율"
                value={inputs.taxRate}
                min={0}
                max={100}
                step={0.1}
                suffix="%"
                onChange={(value) => updateNumber('taxRate', value)}
              />
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-600">
                  계산 기간
                </span>
                <select
                  className={inputClass}
                  value={inputs.simulationYears}
                  onChange={(event) =>
                    onChange({
                      ...inputs,
                      simulationYears: Number(event.target.value),
                    })
                  }
                >
                  {simulationYearOptions.map((year) => (
                    <option value={year} key={year}>
                      {year}년
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <NumberControl
              label="목표 수량"
              value={inputs.targetShares}
              min={0}
              step={1}
              suffix="주"
              onChange={(value) => updateNumber('targetShares', value)}
            />

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <NumberControl
                label="USD/KRW"
                value={inputs.usdKrwRate}
                min={0}
                step={0.01}
                suffix="원"
                helper={
                  exchangeRateInfo
                    ? `${exchangeRateInfo.source} · 기준 ${exchangeRateInfo.date}`
                    : exchangeRateError ?? '원화 환산에 사용'
                }
                onChange={(value) => updateNumber('usdKrwRate', value)}
              />
              <button
                className="h-10 whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={onFetchExchangeRate}
                disabled={isExchangeRateLoading}
              >
                {isExchangeRateLoading ? '갱신 중' : '환율 갱신'}
              </button>
            </div>

            {exchangeRateInfo?.fiveYear ? (
              <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                현재 {formatUsd(1)} ={' '}
                {exchangeRateInfo.rate.toLocaleString('ko-KR')}원 · 5년 평균{' '}
                {exchangeRateInfo.fiveYear.averageRate.toLocaleString('ko-KR')}원
              </p>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-600">
                재투자 방식
              </span>
              <div className="grid h-10 grid-cols-2 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-1">
                <button
                  className={`rounded text-sm font-black transition ${
                    inputs.reinvestmentMode === 'integer'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white'
                  }`}
                  type="button"
                  onClick={() => updateMode('integer')}
                >
                  정수주 재투자
                </button>
                <button
                  className={`rounded text-sm font-black transition ${
                    inputs.reinvestmentMode === 'fractional'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white'
                  }`}
                  type="button"
                  onClick={() => updateMode('fractional')}
                >
                  소수점주 재투자
                </button>
              </div>
            </div>
          </div>
        </PanelSection>
      </div>

      <div className="mt-5 grid min-w-0 gap-2">
        <button
          className={`calculate-submit-button relative h-12 overflow-hidden rounded-md px-4 text-sm font-black text-white transition hover:bg-[#052f62] focus:outline-none focus:ring-4 focus:ring-blue-100 ${
            isCalculationFeedbackActive
              ? 'calculate-submit-button--confirmed bg-emerald-600'
              : 'bg-[#063a78]'
          }`}
          type="submit"
          aria-live="polite"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isCalculationFeedbackActive
                  ? 'calculate-feedback-dot bg-white'
                  : 'bg-emerald-300'
              }`}
              aria-hidden="true"
            />
            {isCalculationFeedbackActive ? '계산 반영 완료' : '계산 시작'}
          </span>
        </button>
        <p
          className={`min-h-5 text-center text-xs font-bold transition ${
            isCalculationFeedbackActive
              ? 'text-emerald-700 opacity-100'
              : 'text-transparent opacity-0'
          }`}
        >
          입력값으로 결과와 차트를 다시 계산했어.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={onLoadExample}
          >
            예시값
          </button>
          <button
            className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-500 transition hover:bg-slate-50"
            type="button"
            onClick={onReset}
          >
            입력 초기화
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs leading-5 text-orange-800">
        <p className="font-black">이 계산기는 투자 조언이 아니라 시뮬레이션 도구야.</p>
        <p className="mt-1 text-orange-700">
          자동 조회값은 참고용이라 실제 투자 전 공식 자료를 확인해야 해.
        </p>
      </div>
    </form>
  )
}
