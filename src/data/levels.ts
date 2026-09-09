import type { Level } from '../logic/board'
import raw from './levels.json'

type RawLevel = (typeof raw.levels)[number]

// The bundled JSON is typed at compile time; the only shape TypeScript cannot
// infer from it is the [x, y] tuple, so malformed entries are dropped here.
function toLevel(level: RawLevel): Level {
  const mines: [number, number][] = []
  for (const entry of level.mines) {
    if (entry.length === 2) {
      mines.push([entry[0], entry[1]])
    }
  }
  return { ...level, mines }
}

export const levels: Level[] = raw.levels.map(toLevel)
