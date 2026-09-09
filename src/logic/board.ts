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

function isFinished(board: Board): boolean {
  return board.state === 'won' || board.state === 'lost'
}

function replaceCell(cells: Cell[], index: number, patch: Partial<Cell>): Cell[] {
  return cells.map((cell, i) => (i === index ? { ...cell, ...patch } : cell))
}

export function toggleFlag(board: Board, index: number): Board {
  const cell = board.cells[index]
  if (isFinished(board) || cell === undefined || cell.revealed) {
    return board
  }
  return { ...board, cells: replaceCell(board.cells, index, { flagged: !cell.flagged }) }
}

function moveMineToLowestFreeCell(cells: Cell[], from: number): Cell[] | null {
  const target = cells.findIndex((cell, index) => !cell.mine && index !== from)
  if (target === -1) {
    return null
  }
  return cells.map((cell, index) => {
    if (index === from) return { ...cell, mine: false }
    if (index === target) return { ...cell, mine: true }
    return cell
  })
}

export function revealCell(board: Board, index: number): Board {
  const cell = board.cells[index]
  if (isFinished(board) || cell === undefined || cell.revealed || cell.flagged) {
    return board
  }

  let cells = board.cells
  if (board.state === 'idle' && cell.mine) {
    // First reveal is safe: relocate the mine if there is anywhere to put it.
    const moved = moveMineToLowestFreeCell(cells, index)
    if (moved !== null) {
      cells = withAdjacent(moved, board.width, board.height)
    }
  }

  if (cells[index].mine) {
    return { ...board, cells: replaceCell(cells, index, { revealed: true }), state: 'lost' }
  }

  const revealed = cascade(cells, index, board.width, board.height)
  const won = revealed.every((c) => c.mine || c.revealed)
  return { ...board, cells: revealed, state: won ? 'won' : 'playing' }
}

// Reveals the cell and, for cells with no adjacent mines, floods into hidden,
// unflagged neighbours. Iterative to keep large boards off the call stack.
function cascade(cells: Cell[], start: number, width: number, height: number): Cell[] {
  const next = cells.map((cell) => ({ ...cell }))
  const stack = [start]
  while (stack.length > 0) {
    const index = stack.pop()
    if (index === undefined) break
    const cell = next[index]
    if (cell.revealed || cell.flagged) continue
    cell.revealed = true
    if (cell.adjacent === 0) {
      stack.push(...neighboursOf(index, width, height))
    }
  }
  return next
}
