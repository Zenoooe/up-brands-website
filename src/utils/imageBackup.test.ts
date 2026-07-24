import { beforeEach, describe, expect, it, vi } from 'vitest'

const { upload, getPublicUrl, from } = vi.hoisted(() => {
  const upload = vi.fn()
  const getPublicUrl = vi.fn()
  const from = vi.fn(() => ({ upload, getPublicUrl }))
  return { upload, getPublicUrl, from }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: { from },
  },
}))

import { backupImageToSupabase } from './imageBackup'

type FakeResponse = {
  ok: boolean
  statusText?: string
  contentType?: string
}

function makeResponse({ ok, statusText = '', contentType = 'image/jpeg' }: FakeResponse) {
  return {
    ok,
    statusText,
    blob: vi.fn().mockResolvedValue(new Blob(['x'], { type: contentType })),
    headers: { get: vi.fn().mockReturnValue(contentType) },
  }
}

describe('backupImageToSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upload.mockResolvedValue({ data: { path: 'p' }, error: null })
    getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/public/img.jpeg' },
    })
    // jsdom defaults window.location.hostname to 'localhost'
  })

  it('fetches via the Vercel API proxy and uploads the blob, returning the public URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await backupImageToSupabase(
      'https://mir-s3-cdn-cf.behance.net/a/b.jpg',
      'proj-1',
    )

    expect(result).toBe('https://cdn.example.com/public/img.jpeg')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/proxy-image?url=' +
        encodeURIComponent('https://mir-s3-cdn-cf.behance.net/a/b.jpg'),
    )
    expect(from).toHaveBeenCalledWith('project-images')
    const [fileName, blob, opts] = upload.mock.calls[0]
    expect(fileName).toMatch(/^proj-1_\d+\.jpeg$/)
    expect(blob).toBeInstanceOf(Blob)
    expect(opts).toMatchObject({ upsert: true, cacheControl: '31536000' })

    vi.unstubAllGlobals()
  })

  it('falls back to the Vite behance-cdn proxy when the API proxy fails locally', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeResponse({ ok: false, statusText: 'Not Found' }))
      .mockResolvedValueOnce(makeResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await backupImageToSupabase(
      'https://mir-s3-cdn-cf.behance.net/project_modules/x.jpg',
      'proj-2',
    )

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/behance-cdn/project_modules/x.jpg')

    vi.unstubAllGlobals()
  })

  it('falls back to AllOrigins for non-behance URLs when the API proxy fails locally', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeResponse({ ok: false, statusText: 'Bad' }))
      .mockResolvedValueOnce(makeResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await backupImageToSupabase('https://other-cdn.com/x.jpg', 'proj-3')

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.allorigins.win/raw?url=' +
        encodeURIComponent('https://other-cdn.com/x.jpg'),
    )

    vi.unstubAllGlobals()
  })

  it('throws when every fetch attempt fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse({ ok: false, statusText: 'Gateway Timeout' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      backupImageToSupabase('https://other-cdn.com/x.jpg', 'proj-4'),
    ).rejects.toThrow(/Failed to fetch source image/)

    vi.unstubAllGlobals()
  })

  it('propagates Supabase upload errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    upload.mockResolvedValue({ data: null, error: new Error('upload boom') })

    await expect(
      backupImageToSupabase('https://mir-s3-cdn-cf.behance.net/a.jpg', 'proj-5'),
    ).rejects.toThrow('upload boom')

    vi.unstubAllGlobals()
  })
})
