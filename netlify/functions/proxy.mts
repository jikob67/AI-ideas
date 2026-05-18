import type { Config, Context } from '@netlify/functions'

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const url = new URL(req.url).searchParams.get('url')
  if (!url) {
    return Response.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let targetUrl = url
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    })

    const contentType = response.headers.get('Content-Type') || 'text/html'
    const body = await response.text()
    return new Response(body, { headers: { 'Content-Type': contentType } })
  } catch (error: any) {
    console.error(`Proxy error for ${targetUrl}:`, error.message)
    return Response.json({ error: `Failed to fetch URL: ${error.message}` }, { status: 500 })
  }
}

export const config: Config = {
  path: '/api/proxy',
}
