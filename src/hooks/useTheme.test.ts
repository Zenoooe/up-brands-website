import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from './useTheme'

function mockMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark && query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the persisted theme from localStorage when present', () => {
    localStorage.setItem('theme', 'dark')
    mockMatchMedia(false)

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('falls back to the OS preference when nothing is stored (dark)', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('falls back to light when the OS does not prefer dark', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('applies the theme class to the document element and persists it', () => {
    mockMatchMedia(false)

    renderHook(() => useTheme())

    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('toggles between light and dark, updating the DOM and storage', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
