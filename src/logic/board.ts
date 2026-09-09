export type Level = {
  id: string
  name: string
  width: number
  height: number
  mineCount: number
  mines: [number, number][] // [x, y]
}

export type Cell = {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number // number of mines in the 8 neighbouring cells
}

export type Board = {
  width: number
  height: number
  cells: Cell[] // row by row; cell index = y * width + x
  state: 'idle' | 'playing' | 'won' | 'lost'
}

function isInside(x: number, y: number, width: number, height: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < width && y >= 0 && y < height
}

function neighboursOf(index: number, width: number, height: number): number[] {
  const x = index % width
  const y = Math.floor(index / width)
  const result: number[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx
      const ny = y + dy
      if (isInside(nx, ny, width, height)) {
        result.push(ny * width + nx)
      }
    }
  }
  return result
}

function withAdjacent(cells: Cell[], width: number, height: number): Cell[] {
  return cells.map((cell, index) => ({
    ...cell,
    adjacent: neighboursOf(index, width, height).filter((n) => cells[n].mine).length,
  }))
}

export function createBoard(level: Level): Board {
  const { width, height } = level
  // Source of truth is the mine list: duplicates collapse, out-of-bounds entries are dropped.
  const mineIndices = new Set<number>()
  for (const [x, y] of level.mines) {
    if (isInside(x, y, width, height)) {
      mineIndices.add(y * width + x)
    }
  }

  const cells: Cell[] = Array.from({ length: width * height }, (_, index) => ({
    mine: mineIndices.has(index),
    revealed: false,
    flagged: false,
    adjacent: 0,
  }))

  return {
    width,
    height,
    cells: withAdjacent(cells, width, height),
    state: 'idle',
  }
}
