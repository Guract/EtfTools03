import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
const VALID_TICKER_PATTERN = /^[A-Z0-9.^=-]{1,24}$/

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>,
) {
  response.statusCode = statusCode
  response.setHeader('content-type', 'application/json;charset=utf-8')
  response.end(JSON.stringify(payload))
}

async function handleYahooChartRequest(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (!request.url) {
    sendJson(response, 400, { error: 'Missing request URL' })
    return
  }

  const requestUrl = new URL(request.url, 'http://localhost')
  const ticker = requestUrl.searchParams.get('ticker')?.trim().toUpperCase()
  const range = requestUrl.searchParams.get('range') ?? 'max'
  const interval = requestUrl.searchParams.get('interval') ?? '1mo'

  if (!ticker || !VALID_TICKER_PATTERN.test(ticker)) {
    sendJson(response, 400, { error: 'Invalid ticker' })
    return
  }

  const yahooUrl = new URL(`${YAHOO_CHART_URL}/${encodeURIComponent(ticker)}`)
  yahooUrl.searchParams.set('range', range)
  yahooUrl.searchParams.set('interval', interval)
  yahooUrl.searchParams.set('events', 'div|split')

  try {
    const yahooResponse = await fetch(yahooUrl)
    const body = await yahooResponse.text()

    response.statusCode = yahooResponse.status
    response.setHeader('content-type', 'application/json;charset=utf-8')
    response.setHeader('cache-control', 'public, max-age=60')
    response.end(body)
  } catch {
    sendJson(response, 502, { error: 'Yahoo Finance request failed' })
  }
}

function etfApiPlugin(): Plugin {
  return {
    name: 'etf-api',
    configureServer(server) {
      server.middlewares.use('/api/yahoo-chart', handleYahooChartRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/yahoo-chart', handleYahooChartRequest)
    },
  }
}

export default defineConfig({
  plugins: [etfApiPlugin(), react(), tailwindcss()],
})
