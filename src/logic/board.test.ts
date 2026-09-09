import { describe, expect, it } from 'vitest'
import { createBoard, revealCell, toggleFlag, type Level } from './board'

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

  it('does not flag a revealed cell', () => {
    const board = revealCell(createBoard(level()), 1)
    expect(board.cells[1].revealed).toBe(true)

    const result = toggleFlag(board, 1)
    expect(result.cells[1].flagged).toBe(false)
  })

  it('ignores moves on a finished board', () => {
    const lost = revealCell(revealCell(createBoard(level()), 1), 0)
    expect(lost.state).toBe('lost')

    expect(toggleFlag(lost, 4)).toBe(lost)
  })

  it('does not mutate the input board', () => {
    const board = createBoard(level())
    const result = toggleFlag(board, 4)

    expect(board.cells[4].flagged).toBe(false)
    expect(result).not.toBe(board)
    expect(result.cells).not.toBe(board.cells)
  })
})

describe('revealCell', () => {
  // Layout used below (3x3, mine at [0, 0]):
  // * 1 0
  // 1 1 0
  // 0 0 0

  it('reveals a safe cell and moves from idle to playing', () => {
    const board = revealCell(createBoard(level()), 1)

    expect(board.state).toBe('playing')
    expect(board.cells[1].revealed).toBe(true)
  })

  it('moves a mine hit on the first reveal to the lowest free index', () => {
    const board = revealCell(createBoard(level({ mines: [[0, 0], [1, 0]] })), 0)

    expect(board.state).toBe('playing')
    expect(board.cells[0].mine).toBe(false)
    expect(board.cells[0].revealed).toBe(true)
    expect(board.cells[1].mine).toBe(true)
    expect(board.cells[2].mine).toBe(true) // lowest index without a mine that is not the revealed cell
    expect(board.cells[0].adjacent).toBe(1)
    expect(board.cells[3].adjacent).toBe(1)
    expect(board.cells[5].adjacent).toBe(2) // neighbours both mines at [1, 0] and [2, 0]
  })

  it('loses on the first reveal when there is no free cell to move the mine to', () => {
    const full = level({
      mines: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
    })
    const board = revealCell(createBoard(full), 4)

    expect(board.state).toBe('lost')
    expect(board.cells[4].mine).toBe(true)
    expect(board.cells[4].revealed).toBe(true)
  })

  it('loses when a mine is revealed while playing', () => {
    const playing = revealCell(createBoard(level()), 1)
    const board = revealCell(playing, 0)

    expect(board.state).toBe('lost')
    expect(board.cells[0].revealed).toBe(true)
  })

  it('does not reveal a flagged cell', () => {
    const flagged = toggleFlag(createBoard(level()), 1)
    const board = revealCell(flagged, 1)

    expect(board.cells[1].revealed).toBe(false)
    expect(board.state).toBe('idle')
  })

  it('ignores moves on a finished board', () => {
    const lost = revealCell(revealCell(createBoard(level()), 1), 0)
    expect(lost.state).toBe('lost')

    expect(revealCell(lost, 4)).toBe(lost)
  })

  it('keeps mines in place when the first reveal is already safe', () => {
    const before = createBoard(level())
    const after = revealCell(before, 4)

    expect(mineIndices(after.cells)).toEqual(mineIndices(before.cells))
  })

  it('ignores a second reveal of the same cell', () => {
    const once = revealCell(createBoard(level()), 1)

    expect(revealCell(once, 1)).toBe(once)
  })

  it('ignores an index outside the board', () => {
    const board = createBoard(level())

    expect(revealCell(board, 9)).toBe(board)
    expect(revealCell(board, -1)).toBe(board)
    expect(toggleFlag(board, 9)).toBe(board)
  })

  it('does not mutate the input board', () => {
    const board = createBoard(level())
    revealCell(board, 1)

    expect(board.cells[1].revealed).toBe(false)
    expect(board.state).toBe('idle')
  })
})

describe('revealCell cascade and win', () => {
  // 4x3, mine at [3, 0]:
  // 0 0 1 *
  // 0 0 1 1
  // 0 0 0 0
  const cascadeLevel = level({ width: 4, height: 3, mines: [[3, 0]] })

  it('reveals neighbours recursively from an empty cell and stops at numbers', () => {
    const board = revealCell(createBoard(cascadeLevel), 0)

    const revealed = board.cells.map((cell) => cell.revealed)
    expect(revealed).toEqual([
      true, true, true, false,
      true, true, true, true,
      true, true, true, true,
    ])
  })

  it('does not reveal flagged cells during a cascade', () => {
    const flagged = toggleFlag(createBoard(cascadeLevel), 5)
    const board = revealCell(flagged, 0)

    expect(board.cells[5].revealed).toBe(false)
    expect(board.cells[5].flagged).toBe(true)
    expect(board.cells[9].revealed).toBe(true) // cascade flows around the flag
  })

  it('wins when the last safe cell is revealed', () => {
    // 2x1: `* .`
    const board = revealCell(createBoard(level({ width: 2, height: 1, mines: [[0, 0]] })), 1)

    expect(board.state).toBe('won')
  })

  it('does not win while safe cells remain hidden', () => {
    const board = revealCell(createBoard(level()), 1)

    expect(board.state).toBe('playing')
  })

  it('wins immediately on a board without mines', () => {
    const board = revealCell(createBoard(level({ mineCount: 0, mines: [] })), 4)

    expect(board.state).toBe('won')
    expect(board.cells.every((cell) => cell.revealed)).toBe(true)
  })

  it('wins on a full cascade even from idle', () => {
    const board = revealCell(createBoard(cascadeLevel), 0)

    expect(board.state).toBe('won')
  })

  it('ignores reveal and flag after a win', () => {
    const won = revealCell(createBoard(level({ mineCount: 0, mines: [] })), 4)
    expect(won.state).toBe('won')

    expect(revealCell(won, 0)).toBe(won)
    expect(toggleFlag(won, 0)).toBe(won)
  })

  it('cascades from the first reveal after relocating the mine', () => {
    // Mine at [2, 2] moves to index 0 when index 8 is revealed first;
    // index 8 then has no adjacent mines, so the cascade must use the new layout.
    const board = revealCell(createBoard(level({ mines: [[2, 2]] })), 8)

    expect(mineIndices(board.cells)).toEqual([0])
    expect(board.cells[8].adjacent).toBe(0)
    expect(board.cells.map((cell) => cell.revealed)).toEqual([
      false, true, true,
      true, true, true,
      true, true, true,
    ])
    expect(board.state).toBe('won')
  })
})
