import { ETF_PRESETS, findEtfPreset } from '../lib/etfData'
import {
  DIVIDEND_FREQUENCY_OPTIONS,
  getDefaultDividendPaymentMonths,
  getDividendFrequencyLabel,
  getDividendPaymentMonthsLabel,
  getDividendPaymentUnitLabel,
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
  onLoadExample: () => void
  onReset: () => void
  onCurrencyChange: (currency: AssetCurrency) => void
  onSelectPreset: (symbol: string) => void
  onFetchEtfData: () => void
  onFetchExchangeRate: () => void
  etfSnapshot: EtfSnapshot | null
  etfError: string | null
  isEtfLoading: boolean
  exchangeRateInfo: ExchangeRateInfo | null
  exchangeRateError: string | null
  isExchangeRateLoading: boolean
}

interface NumberField {
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
  >
  label: string
  min: number
  max?: number
  step: number
  suffix: (currency: AssetCurrency) => string
  helper?: string
}

const numberFields: NumberField[] = [
  {
    key: 'startPrice',
    label: '처음값',
    min: 0,
    step: 0.01,
    suffix: (currency) => (currency === 'KRW' ? '원' : '$'),
  },
  {
    key: 'currentPrice',
    label: '현재값',
    min: 0,
    step: 0.01,
    suffix: (currency) => (currency === 'KRW' ? '원' : '$'),
  },
  {
    key: 'elapsedYears',
    label: '경과연수',
    min: 0,
    step: 0.01,
    suffix: () => '년',
  },
  {
    key: 'currentShares',
    label: '현재 보유 수량',
    min: 0,
    step: 0.01,
    suffix: () => '주',
  },
  {
    key: 'monthlyPurchaseShares',
    label: '매월 구매 수량',
    min: 0,
    step: 0.01,
    suffix: () => '주',
  },
  {
    key: 'dividendPerPaymentMin',
    label: '1회 배당 최소',
    min: 0,
    step: 0.0001,
    suffix: (currency) => (currency === 'KRW' ? '원' : '$'),
    helper: '선택한 배당 주기의 지급 1회당 금액',
  },
  {
    key: 'dividendPerPaymentMax',
    label: '1회 배당 최대',
    min: 0,
    step: 0.0001,
    suffix: (currency) => (currency === 'KRW' ? '원' : '$'),
    helper: '분기 배당 ETF라면 분기 1회 지급액',
  },
  {
    key: 'taxRate',
    label: '배당세율',
    min: 0,
    max: 100,
    step: 0.1,
    suffix: () => '%',
  },
  {
    key: 'usdKrwRate',
    label: 'USD/KRW',
    min: 0,
    step: 0.01,
    suffix: () => '원',
    helper: '해외 ETF 원화 환산에 사용',
  },
  {
    key: 'targetShares',
    label: '목표 수량',
    min: 0,
    step: 1,
    suffix: () => '주',
  },
]

const simulationYearOptions = Array.from({ length: 30 }, (_, index) => index + 1)
const marketLabels = {
  US: '해외 ETF',
  KR: '국내 ETF',
}

function getDividendModeLabel(snapshot: EtfSnapshot): string {
  if (snapshot.dividendEstimateMode === 'recent-payments') {
    return `${getDividendFrequencyLabel(snapshot.dividendFrequency)} 감지`
  }

  return '배당 이력 없음'
}

export function InputForm({
  inputs,
  onChange,
  onCalculate,
  onLoadExample,
  onReset,
  onCurrencyChange,
  onSelectPreset,
  onFetchEtfData,
  onFetchExchangeRate,
  etfSnapshot,
  etfError,
  isEtfLoading,
  exchangeRateInfo,
  exchangeRateError,
  isExchangeRateLoading,
}: InputFormProps) {
  const selectedPreset = findEtfPreset(inputs.ticker)

  const updateNumber = (key: NumberField['key'], value: string) => {
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
      className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={(event) => {
        event.preventDefault()
        onCalculate()
      }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          ETF 입력값
        </p>
        <h2 className="text-xl font-semibold text-slate-950">
          자동 데이터 + 보유 계획
        </h2>
      </div>

      <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <span className="text-sm font-medium text-slate-700">대표 ETF</span>
          <select
            className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
          {selectedPreset ? (
            <span className="text-xs text-slate-500">
              {selectedPreset.category} · {selectedPreset.note}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">티커</span>
          <input
            className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-base font-semibold uppercase text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            value={inputs.ticker}
            onChange={(event) =>
              onChange({
                ...inputs,
                ticker: event.target.value.toUpperCase(),
              })
            }
            placeholder="QQQI"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">통화</span>
          <select
            className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            value={inputs.assetCurrency}
            onChange={(event) =>
              onCurrencyChange(event.target.value as AssetCurrency)
            }
          >
            <option value="USD">USD</option>
            <option value="KRW">KRW</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <span className="text-sm font-medium text-slate-700">배당 주기</span>
          <select
            className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
          <span className="text-xs text-slate-500">
            지급월: {getDividendPaymentMonthsLabel(
              inputs.dividendFrequency,
              inputs.dividendPaymentMonths,
            )}{' '}
            · 입력 배당금 기준: {getDividendPaymentUnitLabel(inputs.dividendFrequency)}
          </span>
        </label>

        <label className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <span className="text-sm font-medium text-slate-700">ETF 이름</span>
          <input
            className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-base font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            value={inputs.etfName}
            onChange={(event) =>
              onChange({ ...inputs, etfName: event.target.value })
            }
            placeholder="NEOS NASDAQ-100 High Income ETF"
          />
        </label>

        <div className="grid gap-3 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <button
            className="h-11 rounded-md bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onFetchEtfData}
            disabled={isEtfLoading}
          >
            {isEtfLoading ? 'ETF 데이터 불러오는 중...' : 'ETF 데이터 자동 조회'}
          </button>

          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            {etfSnapshot ? (
              <>
                <span className="font-semibold text-slate-800">
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
                  / 1회 · 연 환산{' '}
                  {formatMoney(
                    etfSnapshot.annualDividendAverage,
                    etfSnapshot.currency,
                  )}
                </span>
                <span className="block">
                  지급월{' '}
                  {getDividendPaymentMonthsLabel(
                    etfSnapshot.dividendFrequency,
                    etfSnapshot.dividendPaymentMonths,
                  )}{' '}
                  · 월 환산{' '}
                  {formatMoney(
                    etfSnapshot.monthlyDividendEquivalentAverage,
                    etfSnapshot.currency,
                  )}
                </span>
              </>
            ) : etfError ? (
              <span className="font-semibold text-rose-700">{etfError}</span>
            ) : (
              '프리셋을 고르거나 티커를 입력한 뒤 자동 조회를 누르면 가격과 배당 추정치가 채워져.'
            )}
          </div>
        </div>

        {numberFields.map((field) => (
          <label className="flex flex-col gap-2" key={field.key}>
            <span className="text-sm font-medium text-slate-700">
              {field.label}
            </span>
            <div className="flex h-11 overflow-hidden rounded-md border border-slate-200 bg-slate-50 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus:ring-emerald-100">
              <input
                className="min-w-0 flex-1 bg-transparent px-3 text-base text-slate-950 outline-none"
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={inputs[field.key]}
                onChange={(event) => updateNumber(field.key, event.target.value)}
              />
              <span className="flex w-14 items-center justify-center border-l border-slate-200 text-sm font-semibold text-slate-500">
                {field.suffix(inputs.assetCurrency)}
              </span>
            </div>
            {field.helper ? (
              <span className="text-xs text-slate-500">{field.helper}</span>
            ) : null}
          </label>
        ))}

        <div className="grid gap-3 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <button
            className="h-11 rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onFetchExchangeRate}
            disabled={isExchangeRateLoading}
          >
            {isExchangeRateLoading ? '환율 불러오는 중...' : 'USD/KRW 환율 갱신'}
          </button>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            {exchangeRateInfo ? (
              <>
                <span className="font-semibold text-slate-800">
                  {exchangeRateInfo.source}
                </span>
                {' · '}
                현재 {formatUsd(1)} ={' '}
                {exchangeRateInfo.rate.toLocaleString('ko-KR')}원 · 기준{' '}
                {exchangeRateInfo.date}
                {exchangeRateInfo.fiveYear ? (
                  <span className="block">
                    5년 평균{' '}
                    {exchangeRateInfo.fiveYear.averageRate.toLocaleString(
                      'ko-KR',
                    )}
                    원 · 5년 최고{' '}
                    {exchangeRateInfo.fiveYear.maxRate.toLocaleString('ko-KR')}
                    원
                  </span>
                ) : null}
              </>
            ) : exchangeRateError ? (
              <span className="font-semibold text-rose-700">
                {exchangeRateError}
              </span>
            ) : (
              '해외 ETF를 원화로 볼 때 사용할 환율이야.'
            )}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            시뮬레이션 기간
          </span>
          <select
            className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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

        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            재투자 방식
          </span>
          <div className="grid h-11 grid-cols-2 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-1">
            <button
              className={`rounded px-2 text-sm font-semibold transition ${
                inputs.reinvestmentMode === 'integer'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white'
              } whitespace-nowrap`}
              type="button"
              onClick={() => updateMode('integer')}
            >
              정수주
            </button>
            <button
              className={`rounded px-2 text-sm font-semibold transition ${
                inputs.reinvestmentMode === 'fractional'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white'
              } whitespace-nowrap`}
              type="button"
              onClick={() => updateMode('fractional')}
            >
              소수점주
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
        <button
          className="h-11 rounded-md bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          type="submit"
        >
          계산하기
        </button>
        <button
          className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
          type="button"
          onClick={onLoadExample}
        >
          예시값
        </button>
        <button
          className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
          type="button"
          onClick={onReset}
        >
          초기화
        </button>
      </div>
    </form>
  )
}
