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
import type { AssetCurrency, YearlySimulationRow } from '../types'

interface ChartsPanelProps {
  rows: YearlySimulationRow[]
  currency: AssetCurrency
}

interface ChartCardProps {
  title: string
  description: string
  children: ReactNode
}

const lineColors = {
  reinvestment: '#2563eb',
  noReinvestment: '#059669',
}

function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="h-72 min-w-0 overflow-hidden">{children}</div>
    </article>
  )
}

export function ChartsPanel({ rows, currency }: ChartsPanelProps) {
  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-3">
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
        title="세후 월 배당 비교"
        description="연도 말 보유 수량 기준 예상 월 배당"
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
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="reinvestmentMonthlyAfterTaxDividend"
              name="배당 재투자"
              stroke={lineColors.reinvestment}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="noReinvestmentMonthlyAfterTaxDividend"
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
    </section>
  )
}
