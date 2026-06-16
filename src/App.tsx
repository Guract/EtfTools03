import { useCallback, useEffect, useState } from 'react'
import { ChartsPanel } from './components/ChartsPanel'
import { InputForm } from './components/InputForm'
import { ResultsTable } from './components/ResultsTable'
import { SummaryCards } from './components/SummaryCards'
import { fetchEtfSnapshot, findEtfPreset } from './lib/etfData'
import {
  formatCsvNumber,
  formatKrw,
  formatMoney,
  toKrw,
} from './lib/formatters'
import {
  fetchUsdKrwRate,
  getExchangeRateScenarios,
} from './lib/exchangeRate'
import {
  calculateSimulation,
  EMPTY_INPUTS,
  SAMPLE_INPUTS,
  validateInputs,
} from './lib/simulation'
import type {
  AssetCurrency,
  EtfSnapshot,
  ExchangeRateInfo,
  SimulationInputs,
  SimulationResult,
} from './types'

function inputsFromSnapshot(
  currentInputs: SimulationInputs,
  snapshot: EtfSnapshot,
): SimulationInputs {
  return {
    ...currentInputs,
    etfName: snapshot.name,
    ticker: snapshot.symbol,
    assetCurrency: snapshot.currency,
    startPrice: snapshot.startPrice,
    currentPrice: snapshot.currentPrice,
    elapsedYears: snapshot.elapsedYears,
    dividendFrequency: snapshot.dividendFrequency,
    dividendPaymentMonths: snapshot.dividendPaymentMonths,
    dividendPerPaymentMin: snapshot.dividendPerPaymentMin,
    dividendPerPaymentMax: snapshot.dividendPerPaymentMax,
    simulationStartMonth: Number(snapshot.currentDate.slice(5, 7)),
  }
}

function roundCurrencyValue(value: number, currency: AssetCurrency): number {
  if (currency === 'KRW') {
    return Math.round(value)
  }

  return Number(value.toFixed(4))
}

function convertCurrencyInputs(
  currentInputs: SimulationInputs,
  nextCurrency: AssetCurrency,
  fallbackUsdKrwRate = 0,
): SimulationInputs {
  if (currentInputs.assetCurrency === nextCurrency) {
    return currentInputs
  }

  const usdKrwRate =
    currentInputs.usdKrwRate > 0 ? currentInputs.usdKrwRate : fallbackUsdKrwRate

  if (usdKrwRate <= 0) {
    return {
      ...currentInputs,
      assetCurrency: nextCurrency,
    }
  }

  const multiplier =
    currentInputs.assetCurrency === 'USD' && nextCurrency === 'KRW'
      ? usdKrwRate
      : 1 / usdKrwRate

  return {
    ...currentInputs,
    assetCurrency: nextCurrency,
    usdKrwRate,
    startPrice: roundCurrencyValue(
      currentInputs.startPrice * multiplier,
      nextCurrency,
    ),
    currentPrice: roundCurrencyValue(
      currentInputs.currentPrice * multiplier,
      nextCurrency,
    ),
    dividendPerPaymentMin: roundCurrencyValue(
      currentInputs.dividendPerPaymentMin * multiplier,
      nextCurrency,
    ),
    dividendPerPaymentMax: roundCurrencyValue(
      currentInputs.dividendPerPaymentMax * multiplier,
      nextCurrency,
    ),
  }
}

function App() {
  const [inputs, setInputs] = useState<SimulationInputs>(SAMPLE_INPUTS)
  const [result, setResult] = useState<SimulationResult | null>(() =>
    calculateSimulation(SAMPLE_INPUTS),
  )
  const [errors, setErrors] = useState<string[]>([])
  const [isTableCollapsed, setIsTableCollapsed] = useState(false)
  const [exchangeRateInfo, setExchangeRateInfo] =
    useState<ExchangeRateInfo | null>(null)
  const [isExchangeRateLoading, setIsExchangeRateLoading] = useState(false)
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(null)
  const [etfSnapshot, setEtfSnapshot] = useState<EtfSnapshot | null>(null)
  const [isEtfLoading, setIsEtfLoading] = useState(false)
  const [etfError, setEtfError] = useState<string | null>(null)

  const exchangeRateScenarios = getExchangeRateScenarios(
    exchangeRateInfo,
    inputs.usdKrwRate,
  )
  const tableExchangeRate =
    exchangeRateScenarios.find((scenario) => scenario.key === 'average5y') ??
    exchangeRateScenarios[0]

  const applyInputs = useCallback((nextInputs: SimulationInputs) => {
    const validationErrors = validateInputs(nextInputs)

    setInputs(nextInputs)
    setErrors(validationErrors)
    setResult(
      validationErrors.length > 0 ? null : calculateSimulation(nextInputs),
    )
  }, [])

  const loadExchangeRate = useCallback(async () => {
    setIsExchangeRateLoading(true)
    setExchangeRateError(null)

    try {
      const rateInfo = await fetchUsdKrwRate()
      setExchangeRateInfo(rateInfo)
      setInputs((currentInputs) => ({
        ...currentInputs,
        usdKrwRate: Number(rateInfo.rate.toFixed(2)),
      }))
    } catch (error) {
      setExchangeRateError(
        error instanceof Error
          ? error.message
          : '환율 시나리오를 자동으로 불러오지 못했어.',
      )
    } finally {
      setIsExchangeRateLoading(false)
    }
  }, [])

  const loadEtfData = useCallback(
    async (
      symbol: string,
      fallbackCurrency: AssetCurrency,
      baseInputs: SimulationInputs,
    ) => {
      const ticker = symbol.trim()

      if (!ticker) {
        setEtfError('조회할 티커를 입력해줘.')
        return
      }

      setIsEtfLoading(true)
      setEtfError(null)

      try {
        const snapshot = await fetchEtfSnapshot(ticker, fallbackCurrency)
        const nextInputs = inputsFromSnapshot(baseInputs, snapshot)

        setEtfSnapshot(snapshot)
        applyInputs(nextInputs)
      } catch (error) {
        setEtfSnapshot(null)
        setEtfError(
          error instanceof Error
            ? error.message
            : 'ETF 데이터를 자동으로 불러오지 못했어.',
        )
      } finally {
        setIsEtfLoading(false)
      }
    },
    [applyInputs],
  )

  const loadCurrentEtfData = useCallback(() => {
    void loadEtfData(inputs.ticker, inputs.assetCurrency, inputs)
  }, [inputs, loadEtfData])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void (async () => {
        await loadEtfData(
          SAMPLE_INPUTS.ticker,
          SAMPLE_INPUTS.assetCurrency,
          SAMPLE_INPUTS,
        )
        await loadExchangeRate()
      })()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadExchangeRate, loadEtfData])

  const runCalculation = (nextInputs = inputs) => {
    applyInputs(nextInputs)
  }

  const handleInputsChange = (nextInputs: SimulationInputs) => {
    applyInputs(nextInputs)
  }

  const handleCurrencyChange = (nextCurrency: AssetCurrency) => {
    applyInputs(
      convertCurrencyInputs(inputs, nextCurrency, exchangeRateInfo?.rate ?? 0),
    )
  }

  const selectPreset = (symbol: string) => {
    const preset = findEtfPreset(symbol)

    if (!preset) {
      const nextInputs = {
        ...inputs,
        ticker: '',
      }
      setEtfSnapshot(null)
      setEtfError(null)
      setInputs(nextInputs)
      return
    }

    const nextInputs = {
      ...inputs,
      ticker: preset.symbol,
      etfName: preset.name,
      assetCurrency: preset.currency,
    }

    setInputs(nextInputs)
    void loadEtfData(preset.symbol, preset.currency, nextInputs)
  }

  const loadExample = () => {
    const nextInputs = {
      ...SAMPLE_INPUTS,
      usdKrwRate: inputs.usdKrwRate,
    }

    applyInputs(nextInputs)
    void loadEtfData(nextInputs.ticker, nextInputs.assetCurrency, nextInputs)
  }

  const resetForm = () => {
    setInputs(EMPTY_INPUTS)
    setErrors([])
    setResult(null)
    setExchangeRateInfo(null)
    setExchangeRateError(null)
    setEtfSnapshot(null)
    setEtfError(null)
  }

  const downloadCsv = () => {
    if (!result) {
      return
    }

    const headers = [
      '연도',
      '예상 ETF 가격',
      '재투자 보유 수량',
      '재투자 세후 1회 배당',
      '재투자 세후 연 배당',
      '재투자 세후 월 환산',
      '재투자 누적 배당',
      '재투자 총 평가금액',
      '재투자 총 평가금액 원화',
      '비재투자 보유 수량',
      '비재투자 세후 1회 배당',
      '비재투자 세후 연 배당',
      '비재투자 세후 월 환산',
      '비재투자 누적 현금 배당',
      '비재투자 총 평가금액',
      '비재투자 총 평가금액 원화',
      '재투자와 비재투자 차이',
      '차이 원화',
    ]

    const rows = result.yearlyRows.map((row) => {
      const reinvestmentKrw = toKrw(
        row.reinvestmentTotalAssetValue,
        inputs.assetCurrency,
        tableExchangeRate?.rate ?? 0,
      )
      const noReinvestmentKrw = toKrw(
        row.noReinvestmentTotalAssetValue,
        inputs.assetCurrency,
        tableExchangeRate?.rate ?? 0,
      )
      const differenceKrw = toKrw(
        row.totalAssetDifference,
        inputs.assetCurrency,
        tableExchangeRate?.rate ?? 0,
      )

      return [
        row.year,
        formatCsvNumber(row.etfPrice),
        formatCsvNumber(row.reinvestmentShares),
        formatCsvNumber(row.reinvestmentPaymentAfterTaxDividend),
        formatCsvNumber(row.reinvestmentAnnualAfterTaxDividend),
        formatCsvNumber(row.reinvestmentMonthlyEquivalentAfterTaxDividend),
        formatCsvNumber(row.reinvestmentCumulativeDividend),
        formatCsvNumber(row.reinvestmentTotalAssetValue),
        reinvestmentKrw === null ? '' : formatCsvNumber(reinvestmentKrw),
        formatCsvNumber(row.noReinvestmentShares),
        formatCsvNumber(row.noReinvestmentPaymentAfterTaxDividend),
        formatCsvNumber(row.noReinvestmentAnnualAfterTaxDividend),
        formatCsvNumber(row.noReinvestmentMonthlyEquivalentAfterTaxDividend),
        formatCsvNumber(row.noReinvestmentCumulativeCashDividend),
        formatCsvNumber(row.noReinvestmentTotalAssetValue),
        noReinvestmentKrw === null ? '' : formatCsvNumber(noReinvestmentKrw),
        formatCsvNumber(row.totalAssetDifference),
        differenceKrw === null ? '' : formatCsvNumber(differenceKrw),
      ]
    })

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${inputs.ticker || inputs.etfName || 'etf'}-simulation.csv`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const refreshDashboardData = () => {
    loadCurrentEtfData()
    void loadExchangeRate()
  }

  const isDashboardRefreshing = isEtfLoading || isExchangeRateLoading

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-[#dbe3ef] bg-[#063a78] text-white shadow-sm sm:static sm:bg-white sm:text-slate-950">
        <div className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-end justify-center gap-1 rounded-2xl bg-white/15 p-2 sm:bg-emerald-50">
              <span className="h-4 w-2 rounded-sm bg-emerald-300 sm:bg-emerald-400" />
              <span className="h-6 w-2 rounded-sm bg-emerald-200 sm:bg-emerald-500" />
              <span className="h-8 w-2 rounded-sm bg-white sm:bg-[#0b56a5]" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 border-r-2 border-t-2 border-white sm:border-emerald-500" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black sm:text-3xl">
                ETF 자동 복리 계산기
              </h1>
              <p className="mt-1 hidden max-w-3xl text-sm leading-6 text-slate-500 sm:block">
                가격, 배당 주기, 환율을 바탕으로 장기 보유와 재투자를 시뮬레이션해줘.
              </p>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold sm:border-slate-200 sm:bg-slate-50 sm:text-slate-600">
              선택 ETF
              <span className="ml-2 rounded-lg bg-white px-2 py-1 font-black text-emerald-700 sm:bg-emerald-50">
                {inputs.ticker || 'ETF'}
              </span>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold sm:border-slate-200 sm:bg-slate-50 sm:text-slate-600">
              계산 기간
              <span className="ml-2 rounded-lg bg-white px-2 py-1 font-black text-[#0b56a5] sm:bg-blue-50">
                {inputs.simulationYears}년
              </span>
            </div>
            <button
              className="col-span-2 h-10 rounded-xl border border-white/20 bg-white px-4 text-sm font-black text-[#063a78] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:border-slate-200 sm:bg-white sm:text-slate-700"
              type="button"
              onClick={refreshDashboardData}
              disabled={isDashboardRefreshing}
            >
              {isDashboardRefreshing ? '업데이트 중...' : '데이터 업데이트'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] min-w-0 gap-5 px-3 py-4 sm:px-6 lg:px-8">
        <section className="grid min-w-0 gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
          <InputForm
            inputs={inputs}
            onChange={handleInputsChange}
            onCalculate={() => runCalculation()}
            onLoadExample={loadExample}
            onReset={resetForm}
            onCurrencyChange={handleCurrencyChange}
            onSelectPreset={selectPreset}
            onFetchEtfData={loadCurrentEtfData}
            onFetchExchangeRate={loadExchangeRate}
            etfSnapshot={etfSnapshot}
            etfError={etfError}
            isEtfLoading={isEtfLoading}
            exchangeRateInfo={exchangeRateInfo}
            exchangeRateError={exchangeRateError}
            isExchangeRateLoading={isExchangeRateLoading}
          />

          <div className="grid min-w-0 content-start gap-5">
            {errors.length > 0 ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                <p className="font-bold">입력값을 다시 확인해줘.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result ? (
              <SummaryCards
                inputs={inputs}
                result={result}
                etfSnapshot={etfSnapshot}
                exchangeRateInfo={exchangeRateInfo}
                exchangeRateScenarios={exchangeRateScenarios}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600">
                <p className="text-lg font-bold text-slate-950">
                  입력값을 넣고 계산하기를 눌러줘.
                </p>
                <p className="mt-2">
                  자동 조회가 실패해도 처음값, 현재값, 경과연수, 배당 주기를 직접
                  입력해서 계산할 수 있어.
                </p>
              </div>
            )}
          </div>
        </section>

        {result ? (
          <>
            <ChartsPanel
              rows={result.yearlyRows}
              currency={inputs.assetCurrency}
              dividendFrequency={inputs.dividendFrequency}
            />

            <ResultsTable
              rows={result.yearlyRows}
              currency={inputs.assetCurrency}
              reinvestmentMode={inputs.reinvestmentMode}
              dividendFrequency={inputs.dividendFrequency}
              dividendPaymentMonths={inputs.dividendPaymentMonths}
              isCollapsed={isTableCollapsed}
              onToggleCollapsed={() => setIsTableCollapsed((value) => !value)}
              onDownloadCsv={downloadCsv}
              exchangeRateScenarios={exchangeRateScenarios}
            />
          </>
        ) : null}

        <footer className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
          <p className="font-semibold text-slate-800">
            이 계산기는 투자 조언이 아니라 시뮬레이션 도구야.
          </p>
          <p className="mt-1">
            가격, 배당, 환율, 세금은 실제로 변동될 수 있어. 자동 조회값은{' '}
            {etfSnapshot ? `${etfSnapshot.source} 기준` : '외부 데이터 기준'}이고,
            최종 판단 전에는 증권사와 공식 운용사 자료도 같이 확인하는 게 좋아.
          </p>
          {result ? (
            <p className="mt-1 font-semibold text-slate-700">
              현재 계산의 최종 세후 연 배당:{' '}
              {formatMoney(
                result.finalRow.reinvestmentAnnualAfterTaxDividend,
                inputs.assetCurrency,
              )}
              {' · 원화 '}
              {formatKrw(
                toKrw(
                  result.finalRow.reinvestmentAnnualAfterTaxDividend,
                  inputs.assetCurrency,
                  tableExchangeRate?.rate ?? inputs.usdKrwRate,
                ) ?? 0,
              )}
            </p>
          ) : null}
        </footer>
      </main>
    </div>
  )
}

export default App
