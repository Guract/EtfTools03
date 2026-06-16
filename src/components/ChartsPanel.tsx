import type { ReactNode } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  formatCompactMoney,
  formatMoney,
  formatNumber,
} from '../lib/formatters'
import type {
  AssetCurrency,
  DividendFrequency,
  YearlySimulationRow,
} from '../types'
import { getDividendFrequencyLabel } from '../lib/dividends'

interface ChartsPanelProps {
  rows: YearlySimulationRow[]
  currency: AssetCurrency
  dividendFrequency: DividendFrequency
}

interface ChartCardProps {
  title: string
  description: string
  children: ReactNode
}

const lineColors = {
  reinvestment: '#059669',
  noReinvestment: '#64748b',
}

function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-base font-black text-[#0b2d5c]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <div className="h-72 min-w-0 overflow-hidden">{children}</div>
    </article>
  )
}

export function ChartsPanel({
  rows,
  currency,
  dividendFrequency,
}: ChartsPanelProps) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-black text-[#0b2d5c]">
            시뮬레이션 비교 차트
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            재투자와 비재투자의 장기 차이를 같은 축에서 비교해.
          </p>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
        <ChartCard
          title="보유 수량 비교"
          description="직접 매수와 배당 재투자가 만든 수량 차이"
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={288}
            initialDimension={{ width: 360, height: 288 }}
          >
            <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}년`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={54}
                tickFormatter={(value) => formatNumber(Number(value))}
              />
              <Tooltip
                formatter={(value) => [`${formatNumber(Number(value))}주`, '']}
                labelFormatter={(value) => `${value}년`}
                contentStyle={{
                  border: '1px solid #dbe3ef',
                  borderRadius: 12,
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="reinvestmentShares"
                name="배당 재투자"
                stroke={lineColors.reinvestment}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="noReinvestmentShares"
                name="배당 비재투자"
                stroke={lineColors.noReinvestment}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="세후 연 배당 비교"
          description={`연도 말 보유 수량 기준 ${getDividendFrequencyLabel(
            dividendFrequency,
          )}의 연간 환산 배당`}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={288}
            initialDimension={{ width: 360, height: 288 }}
          >
            <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}년`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(value) =>
                  formatCompactMoney(Number(value), currency)
                }
              />
              <Tooltip
                formatter={(value) => [formatMoney(Number(value), currency), '']}
                labelFormatter={(value) => `${value}년`}
                contentStyle={{
                  border: '1px solid #dbe3ef',
                  borderRadius: 12,
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="reinvestmentAnnualAfterTaxDividend"
                name="배당 재투자"
                stroke={lineColors.reinvestment}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="noReinvestmentAnnualAfterTaxDividend"
                name="배당 비재투자"
                stroke={lineColors.noReinvestment}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="총 자산 가치 비교"
          description="평가금액과 남은 현금 배당까지 더한 기준"
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={288}
            initialDimension={{ width: 360, height: 288 }}
          >
            <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}년`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={78}
                tickFormatter={(value) =>
                  formatCompactMoney(Number(value), currency)
                }
              />
              <Tooltip
                formatter={(value) => [formatMoney(Number(value), currency), '']}
                labelFormatter={(value) => `${value}년`}
                contentStyle={{
                  border: '1px solid #dbe3ef',
                  borderRadius: 12,
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="reinvestmentTotalAssetValue"
                name="배당 재투자"
                stroke={lineColors.reinvestment}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="noReinvestmentTotalAssetValue"
                name="배당 비재투자"
                stroke={lineColors.noReinvestment}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  )
}
