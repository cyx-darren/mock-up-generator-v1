import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      const result = cn('bg-red-500', 'text-white')
      expect(result).toBe('bg-red-500 text-white')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class active-class')
    })

    it('handles false conditional classes', () => {
      const isActive = false
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class')
    })

    it('handles Tailwind conflicts correctly', () => {
      const result = cn('p-4', 'p-2')
      expect(result).toBe('p-2')
    })

    it('handles complex Tailwind conflicts', () => {
      const result = cn('bg-red-500 text-white', 'bg-blue-500')
      expect(result).toBe('text-white bg-blue-500')
    })

    it('handles array inputs', () => {
      const result = cn(['bg-red-500', 'text-white'])
      expect(result).toBe('bg-red-500 text-white')
    })

    it('handles object inputs', () => {
      const result = cn({
        'bg-red-500': true,
        'text-white': true,
        'border-black': false,
      })
      expect(result).toBe('bg-red-500 text-white')
    })

    it('handles mixed input types', () => {
      const result = cn(
        'base-class',
        ['array-class-1', 'array-class-2'],
        {
          'object-class-1': true,
          'object-class-2': false,
        },
        false && 'conditional-class',
        'final-class'
      )
      expect(result).toBe('base-class array-class-1 array-class-2 object-class-1 final-class')
    })

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'end-class')
      expect(result).toBe('base-class end-class')
    })

    it('handles empty string', () => {
      const result = cn('base-class', '', 'end-class')
      expect(result).toBe('base-class end-class')
    })

    it('handles no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })
})