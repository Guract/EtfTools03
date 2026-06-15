const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
const VALID_TICKER_PATTERN = /^[A-Z0-9.^=-]{1,24}$/
const VALID_RANGE_PATTERN = /^(?:\d+(?:d|mo|y)|ytd|max)$/
const VALID_INTERVAL_PATTERN = /^(?:\d+(?:mo|wk|m|h|d)|1h)$/

function json(status, payload) {
  return Response.json(payload, {
    status,
    headers: {
      'cache-control': 'no-store',
    },
  })
}

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const ticker = requestUrl.searchParams.get('ticker')?.trim().toUpperCase()
  const range = requestUrl.searchParams.get('range') ?? 'max'
  const interval = requestUrl.searchParams.get('interval') ?? '1mo'

  if (!ticker || !VALID_TICKER_PATTERN.test(ticker)) {
    return json(400, { error: 'Invalid ticker' })
  }

  if (!VALID_RANGE_PATTERN.test(range)) {
    return json(400, { error: 'Invalid range' })
  }

  if (!VALID_INTERVAL_PATTERN.test(interval)) {
    return json(400, { error: 'Invalid interval' })
  }

  const yahooUrl = new URL(`${YAHOO_CHART_URL}/${encodeURIComponent(ticker)}`)
  yahooUrl.searchParams.set('range', range)
  yahooUrl.searchParams.set('interval', interval)
  yahooUrl.searchParams.set('events', 'div|split')

  try {
    const yahooResponse = await fetch(yahooUrl, {
      headers: {
        accept: 'application/json',
      },
    })
    const body = await yahooResponse.text()

    return new Response(body, {
      status: yahooResponse.status,
      headers: {
        'content-type': 'application/json;charset=utf-8',
        'cache-control': 'public, max-age=60, s-maxage=300',
      },
    })
  } catch {
    return json(502, { error: 'Yahoo Finance request failed' })
  }
}
