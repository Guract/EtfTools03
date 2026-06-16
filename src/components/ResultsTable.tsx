import {
  getDividendPaymentMonthsLabel,
  getDividendPaymentUnitLabel,
} from '../lib/dividends'
import {
  formatKrw,
  formatMoney,
  formatShares,
  toKrw,
} from '../lib/formatters'
import type {
  AssetCurrency,
  DividendFrequency,
  ExchangeRateScenario,
  ReinvestmentMode,
  YearlySimulationRow,
} from '../types'

interface ResultsTableProps {
  rows: YearlySimulationRow[]
  currency: AssetCurrency
  reinvestmentMode: ReinvestmentMode
  dividendFrequency: DividendFrequency
  dividendPaymentMonths: number[]
  isCollapsed: boolean
  onToggleCollapsed: () => void
  onDownloadCsv: () => void
  exchangeRateScenarios: ExchangeRateScenario[]
}

export function ResultsTable({
  rows,
  currency,
  reinvestmentMode,
  dividendFrequency,
  dividendPaymentMonths,
  isCollapsed,
  onToggleCollapsed,
  onDownloadCsv,
  exchangeRateScenarios,
}: ResultsTableProps) {
  const tableExchangeRate =
    exchangeRateScenarios.find((scenario) => scenario.key === 'average5y') ??
    exchangeRateScenarios[0]
  const krwRate = tableExchangeRate?.rate ?? 0
  const krwLabel =
    currency === 'KRW'
      ? '원화'
      : tableExchangeRate
        ? `원화(${tableExchangeRate.label})`
        : '원화'
  const displayKrw = (value: number) => {
    const krwValue = toKrw(value, currency, krwRate)
    return krwValue === null ? '환율 필요' : formatKrw(krwValue)
  }
  const paymentUnitLabel = getDividendPaymentUnitLabel(dividendFrequency)
  const paymentMonthsLabel = getDividendPaymentMonthsLabel(
    dividendFrequency,
    dividendPaymentMonths,
  )

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-black text-[#0b2d5c]">
            연도별 시뮬레이션 결과
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            지급월({paymentMonthsLabel})에만 배당을 반영하고 연 단위로 요약해.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="h-10 flex-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:flex-none"
            type="button"
            onClick={onToggleCollapsed}
          >
            {isCollapsed ? '펼치기' : '접기'}
          </button>
          <button
            className="h-10 flex-1 whitespace-nowrap rounded-md bg-[#063a78] px-3 text-sm font-black text-white transition hover:bg-[#052f62] sm:flex-none"
            type="button"
            onClick={onDownloadCsv}
          >
            CSV 다운로드
          </button>
        </div>
      </div>

      {isCollapsed ? null : (
        <>
          <div className="grid gap-3 p-3 lg:hidden">
            {rows.map((row) => (
              <article
                className={
                  row.isReinvestmentTargetYear ||
                  row.isNoReinvestmentTargetYear
                    ? 'rounded-lg border border-emerald-200 bg-emerald-50 p-4'
                    : 'rounded-lg border border-slate-200 bg-white p-4'
                }
                key={row.year}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      연도
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-950">
                      {row.year}년
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500">
                      차이
                    </p>
                    <p
                      className={`mt-1 text-lg font-bold ${
                        row.totalAssetDifference >= 0
                          ? 'text-blue-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {formatMoney(row.totalAssetDifference, currency)}
                    </p>
                  </div>
                </div>

                {row.isReinvestmentTargetYear || row.isNoReinvestmentTargetYear ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.isReinvestmentTargetYear ? (
                      <span className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                        재투자 목표
                      </span>
                    ) : null}
                    {row.isNoReinvestmentTargetYear ? (
                      <span className="rounded bg-slate-700 px-2 py-1 text-xs font-bold text-white">
                        비재투자 목표
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-slate-50 p-3">
                    <dt className="text-xs font-semibold text-slate-500">
                      예상 가격
                    </dt>
                    <dd className="mt-1 font-bold text-slate-950">
                      {formatMoney(row.etfPrice, currency)}
                    </dd>
                  </div>
                  <div className="rounded-md bg-blue-50 p-3">
                    <dt className="text-xs font-semibold text-blue-600">
                      재투자 수량
                    </dt>
                    <dd className="mt-1 font-bold text-blue-700">
                      {formatShares(row.reinvestmentShares, reinvestmentMode)}주
                    </dd>
                  </div>
                  <div className="rounded-md bg-emerald-50 p-3">
                    <dt className="text-xs font-semibold text-emerald-700">
                      재투자 세후 {paymentUnitLabel} 배당
                    </dt>
                    <dd className="mt-1 font-bold text-emerald-700">
                      {formatMoney(
                        row.reinvestmentPaymentAfterTaxDividend,
                        currency,
                      )}
                    </dd>
                  </div>
                  <div className="rounded-md bg-emerald-50 p-3">
                    <dt className="text-xs font-semibold text-emerald-700">
                      재투자 세후 연 배당
                    </dt>
                    <dd className="mt-1 font-bold text-emerald-700">
                      {formatMoney(
                        row.reinvestmentAnnualAfterTaxDividend,
                        currency,
                      )}
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <dt className="text-xs font-semibold text-slate-500">
                      재투자 총액
                    </dt>
                    <dd className="mt-1 font-bold text-slate-950">
                      {formatMoney(row.reinvestmentTotalAssetValue, currency)}
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <dt className="text-xs font-semibold text-slate-500">
                      비재투자 수량
                    </dt>
                    <dd className="mt-1 font-bold text-slate-950">
                      {formatShares(row.noReinvestmentShares, reinvestmentMode)}주
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <dt className="text-xs font-semibold text-slate-500">
                      비재투자 총액
                    </dt>
                    <dd className="mt-1 font-bold text-slate-950">
                      {formatMoney(row.noReinvestmentTotalAssetValue, currency)}
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <dt className="text-xs font-semibold text-slate-500">
                      차이 원화
                    </dt>
                    <dd className="mt-1 font-bold text-slate-950">
                      {displayKrw(row.totalAssetDifference)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="hidden max-w-full overflow-x-auto lg:block">
            <table className="min-w-[1400px] border-collapse text-left text-sm">
              <thead className="bg-[#f7faff] text-xs font-black text-slate-500">
                <tr>
                  <th className="px-4 py-3">연도</th>
                  <th className="px-4 py-3">예상 가격</th>
                  <th className="px-4 py-3">재투자 수량</th>
                  <th className="px-4 py-3">재투자 세후 1회 배당</th>
                  <th className="px-4 py-3">재투자 세후 연 배당</th>
                  <th className="px-4 py-3">재투자 세후 월 환산</th>
                  <th className="px-4 py-3">재투자 총액</th>
                  <th className="px-4 py-3">재투자 총액 {krwLabel}</th>
                  <th className="px-4 py-3">비재투자 수량</th>
                  <th className="px-4 py-3">비재투자 세후 1회 배당</th>
                  <th className="px-4 py-3">비재투자 세후 연 배당</th>
                  <th className="px-4 py-3">비재투자 세후 월 환산</th>
                  <th className="px-4 py-3">비재투자 총액</th>
                  <th className="px-4 py-3">비재투자 총액 {krwLabel}</th>
                  <th className="px-4 py-3">자산 차이</th>
                  <th className="px-4 py-3">자산 차이 {krwLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    className={
                      row.isReinvestmentTargetYear ||
                      row.isNoReinvestmentTargetYear
                        ? 'bg-emerald-50'
                        : 'bg-white'
                    }
                    key={row.year}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-950">
                      {row.year}년
                      {row.isReinvestmentTargetYear ? (
                        <span className="ml-2 rounded bg-emerald-600 px-2 py-1 text-xs text-white">
                          재투자 목표
                        </span>
                      ) : null}
                      {row.isNoReinvestmentTargetYear ? (
                        <span className="ml-2 rounded bg-slate-700 px-2 py-1 text-xs text-white">
                          비재투자 목표
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(row.etfPrice, currency)}
                    </td>
                    <td className="px-4 py-3 text-blue-700">
                      {formatShares(row.reinvestmentShares, reinvestmentMode)}주
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatMoney(
                        row.reinvestmentPaymentAfterTaxDividend,
                        currency,
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatMoney(
                        row.reinvestmentAnnualAfterTaxDividend,
                        currency,
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(
                        row.reinvestmentMonthlyEquivalentAfterTaxDividend,
                        currency,
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(row.reinvestmentTotalAssetValue, currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {displayKrw(row.reinvestmentTotalAssetValue)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatShares(row.noReinvestmentShares, reinvestmentMode)}주
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(
                        row.noReinvestmentPaymentAfterTaxDividend,
                        currency,
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(
                        row.noReinvestmentAnnualAfterTaxDividend,
                        currency,
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(
                        row.noReinvestmentMonthlyEquivalentAfterTaxDividend,
                        currency,
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(row.noReinvestmentTotalAssetValue, currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {displayKrw(row.noReinvestmentTotalAssetValue)}
                    </td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        row.totalAssetDifference >= 0
                          ? 'text-blue-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {formatMoney(row.totalAssetDifference, currency)}
                    </td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        row.totalAssetDifference >= 0
                          ? 'text-blue-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {displayKrw(row.totalAssetDifference)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
