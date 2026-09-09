import { describe, expect, it } from 'vitest'
import { levels } from './levels'

describe('levels', () => {
  it('loads every level from the json file', () => {
    expect(levels.map((level) => level.id)).toEqual([
      'rozgrzewka',
      'spacer',
      'rachmistrz',
      'bliznieta',
      'za-plotem',
      'laka',
      'ciasno',
    ])
  })

  it('exposes mines as [x, y] pairs', () => {
    const pairs = levels.flatMap((level) => level.mines)

    expect(pairs.length).toBeGreaterThan(0)
    expect(pairs.every((pair) => pair.length === 2)).toBe(true)
  })
})
