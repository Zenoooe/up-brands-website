import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSupabaseUrl, toWpImageProxyUrl } from './image'

describe('toWpImageProxyUrl', () => {
  it('strips the https:// prefix and proxies through i0.wp.com', () => {
    expect(toWpImageProxyUrl('https://example.com/a/b.jpg')).toBe(
      'https://i0.wp.com/example.com/a/b.jpg',
    )
  })

  it('strips the http:// prefix as well', () => {
    expect(toWpImageProxyUrl('http://example.com/img.png')).toBe(
      'https://i0.wp.com/example.com/img.png',
    )
  })

  it('leaves protocol-less URLs untouched apart from prefixing', () => {
    expect(toWpImageProxyUrl('example.com/img.png')).toBe(
      'https://i0.wp.com/example.com/img.png',
    )
  })

  it('only removes the leading protocol, not later occurrences', () => {
    expect(toWpImageProxyUrl('https://a.com/redirect?to=https://b.com')).toBe(
      'https://i0.wp.com/a.com/redirect?to=https://b.com',
    )
  })
})

describe('getSupabaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the input unchanged when the URL is empty', () => {
    expect(getSupabaseUrl('', 800)).toBe('')
  })

  it('returns the input unchanged for non-supabase URLs', () => {
    const url = 'https://mir-s3-cdn-cf.behance.net/foo/bar.jpg'
    expect(getSupabaseUrl(url, 800)).toBe(url)
  })

  it('rewrites a supabase public object URL to the default CDN with optimization params', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/project-images/img.jpg'
    expect(getSupabaseUrl(url, 640)).toBe(
      'https://cdn.up-brands.com/project-images/img.jpg?width=640&quality=85&format=webp',
    )
  })

  it('honours the VITE_SUPABASE_CDN_URL override when set', () => {
    vi.stubEnv('VITE_SUPABASE_CDN_URL', 'https://custom-cdn.example.com')
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/bucket/photo.png'
    expect(getSupabaseUrl(url, 1024)).toBe(
      'https://custom-cdn.example.com/bucket/photo.png?width=1024&quality=85&format=webp',
    )
  })

  it('appends the requested width to the query string', () => {
    const url =
      'https://xyz.supabase.co/storage/v1/object/public/bucket/photo.png'
    expect(getSupabaseUrl(url, 320)).toContain('width=320')
  })
})
