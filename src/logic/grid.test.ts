import { describe, expect, it } from 'vitest'
import { neighboursOf } from './grid'

describe('neighboursOf', () => {
  // 3x3 indices:
  // 0 1 2
  // 3 4 5
  // 6 7 8

  it('returns three neighbours for a corner cell', () => {
    expect(neighboursOf(0, 3, 3)).toEqual([1, 3, 4])
  })

  it('does not wrap around the right edge', () => {
    expect(neighboursOf(5, 3, 3)).toEqual([1, 2, 4, 7, 8])
  })

  it('returns all eight neighbours for a center cell', () => {
    expect(neighboursOf(4, 3, 3)).toEqual([0, 1, 2, 3, 5, 6, 7, 8])
  })

  it('returns nothing on a single-cell board', () => {
    expect(neighboursOf(0, 1, 1)).toEqual([])
  })
})
