import { GET } from './route'

class MockResponse {
  status: number
  ok: boolean
  headers: Headers
  body: string | ReadableStream | null

  constructor(body: string | ReadableStream | null, init?: ResponseInit) {
    this.status = init?.status ?? 200
    this.ok = this.status >= 200 && this.status < 300
    this.headers = new Headers(init?.headers)
    this.body = body
  }

  async text() {
    return typeof this.body === 'string' ? this.body : ''
  }
}

class MockRequest {
  url: string

  constructor(url: string) {
    this.url = url
  }
}

describe('GET /api/download', () => {
  const originalBucketName = process.env.SCW_BUCKET_NAME
  const originalRegion = process.env.SCW_REGION

  beforeEach(() => {
    process.env.SCW_BUCKET_NAME = 'my-bucket'
    process.env.SCW_REGION = 'fr-par'
    Object.defineProperty(globalThis, 'Request', {
      value: MockRequest,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'Response', {
      value: MockResponse,
      writable: true,
      configurable: true,
    })
    jest.restoreAllMocks()
  })

  afterAll(() => {
    process.env.SCW_BUCKET_NAME = originalBucketName
    process.env.SCW_REGION = originalRegion
  })

  it('rejects non allowlisted download URLs', async () => {
    const fetchMock = jest.fn()
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      writable: true,
      configurable: true,
    })

    const req = new MockRequest(
      'http://localhost/api/download?url=https://evil.example.com/private.pdf&fileName=evil.pdf',
    )

    const response = await GET(req as any)

    expect(response.status).toBe(400)
    expect(await response.text()).toContain('Forbidden download source')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('allows downloads from the configured Scaleway bucket host', async () => {
    const signedUrl = 'https://my-bucket.s3.fr-par.scw.cloud/report.pdf?X-Amz-Signature=abc'
    const fetchMock = jest
      .fn()
      .mockResolvedValue(
        new MockResponse('pdf-content', { status: 200, headers: { 'content-type': 'application/pdf' } }),
      )
    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      writable: true,
      configurable: true,
    })

    const req = new MockRequest(
      `http://localhost/api/download?url=${encodeURIComponent(signedUrl)}&fileName=report.pdf`,
    )

    const response = await GET(req as any)

    expect(fetchMock).toHaveBeenCalledWith(signedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('pdf-content')
  })
})
