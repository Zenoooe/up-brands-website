import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins multiple class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('supports conditional object syntax from clsx', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('flattens arrays of class values', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('merges conflicting tailwind classes keeping the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('keeps non-conflicting tailwind classes', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('returns an empty string with no arguments', () => {
    expect(cn()).toBe('')
  })
})
