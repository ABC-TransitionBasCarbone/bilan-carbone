import { NextRequest } from 'next/server'

const getAllowedDownloadHosts = () => {
  const bucketName = process.env.SCW_BUCKET_NAME
  const region = process.env.SCW_REGION

  if (!bucketName || !region) {
    return new Set<string>()
  }

  return new Set([`${bucketName}.s3.${region}.scw.cloud`])
}

const isAllowedDownloadUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && getAllowedDownloadHosts().has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const fileName = searchParams.get('fileName') || 'download'

  if (!url || !isAllowedDownloadUrl(url)) {
    return new Response('Forbidden download source', { status: 400 })
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
      'Content-Disposition': `attachment; filename="${fileName.replace(/[\\/]+/g, '_')}"`,
    },
  })
}
