import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const fileName = searchParams.get('fileName')

  if (!url) {
    return new Response('Missing url', { status: 400 })
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  if (!response.ok || !response.body) {
    return new Response('Failed to fetch file', { status: response.status })
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
