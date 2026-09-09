import { describe, expect, it } from 'vitest'
import { createBoard, toggleFlag, type Level } from './board'

const level = (overrides: Partial<Level> = {}): Level => ({
  id: 'test',
  name: 'Test',
  width: 3,
  height: 3,
  mineCount: 1,
  mines: [[0, 0]],
  ...overrides,
})

const mineIndices = (cells: { mine: boolean }[]) =>
  cells.flatMap((cell, index) => (cell.mine ? [index] : []))

describe('createBoard', () => {
  it('creates width * height cells indexed row by row', () => {
    const board = createBoard(level({ width: 4, height: 2, mines: [[3, 1]] }))

    expect(board.width).toBe(4)
    expect(board.height).toBe(2)
    expect(board.cells).toHaveLength(8)
    expect(mineIndices(board.cells)).toEqual([1 * 4 + 3])
  })

  it('starts idle with nothing revealed or flagged', () => {
    const board = createBoard(level())

    expect(board.state).toBe('idle')
    expect(board.cells.every((cell) => !cell.revealed && !cell.flagged)).toBe(true)
  })

  it('counts adjacent mines for corner, edge and center cells', () => {
    // . * .
    // * . *
    // . * .
    const board = createBoard(
      level({ mines: [[1, 0], [0, 1], [2, 1], [1, 2]] }),
    )

    expect(board.cells[0].adjacent).toBe(2) // corner
    expect(board.cells[1].adjacent).toBe(2) // edge (mine itself, still counts neighbours)
    expect(board.cells[4].adjacent).toBe(4) // center
    expect(board.cells[8].adjacent).toBe(2) // corner
  })

  it('counts a duplicated mine only once', () => {
    const board = createBoard(level({ mines: [[1, 1], [1, 1], [0, 0]] }))

    expect(mineIndices(board.cells)).toEqual([0, 4])
    expect(board.cells[0].adjacent).toBe(1)
  })

  it('ignores mines outside the board', () => {
    const board = createBoard(
      level({ mines: [[3, 0], [0, 3], [-1, 0], [1, 1]] }),
    )

    expect(mineIndices(board.cells)).toEqual([4])
  })

  it('derives mines from the list, not from mineCount', () => {
    const board = createBoard(level({ mineCount: 10, mines: [[0, 0], [2, 2]] }))

    expect(mineIndices(board.cells)).toEqual([0, 8])
  })

  it('handles a board without mines', () => {
    const board = createBoard(level({ mineCount: 0, mines: [] }))

    expect(mineIndices(board.cells)).toEqual([])
    expect(board.cells.every((cell) => cell.adjacent === 0)).toBe(true)
    expect(board.state).toBe('idle')
  })

  it('stays idle when every cell is a mine', () => {
    const board = createBoard(
      level({
        mines: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
      }),
    )

    expect(mineIndices(board.cells)).toHaveLength(9)
    expect(board.state).toBe('idle')
  })
})

describe('toggleFlag', () => {
  it('flags a hidden cell and unflags it on the second call', () => {
    const board = createBoard(level())

    const flagged = toggleFlag(board, 4)
    expect(flagged.cells[4].flagged).toBe(true)

    const unflagged = toggleFlag(flagged, 4)
    expect(unflagged.cells[4].flagged).toBe(false)
  })

  it('does not mutate the input board', () => {
    const board = createBoard(level())
    const result = toggleFlag(board, 4)

    expect(board.cells[4].flagged).toBe(false)
    expect(result).not.toBe(board)
    expect(result.cells).not.toBe(board.cells)
  })
})
