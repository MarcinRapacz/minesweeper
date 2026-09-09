import { describe, expect, it } from 'vitest'
import { createBoard, revealCell, toggleFlag, type Board, type Level } from './board'
import { chordCell } from './chord'

// 3x3, mines at [0, 0] and [2, 0]:
// * 2 *
// 1 2 1
// 0 0 0
const level: Level = {
  id: 'chord',
  name: 'Chord',
  width: 3,
  height: 3,
  mineCount: 2,
  mines: [[0, 0], [2, 0]],
}

const flagAll = (board: Board, indices: number[]) =>
  indices.reduce((current, index) => toggleFlag(current, index), board)

describe('chordCell', () => {
  it('reveals remaining neighbours when flags match the number', () => {
    const playing = revealCell(createBoard(level), 1) // "2" between both mines
    const flagged = flagAll(playing, [0, 2])

    const board = chordCell(flagged, 1)

    expect(board.state).toBe('playing')
    expect([3, 4, 5].every((i) => board.cells[i].revealed)).toBe(true)
    expect(board.cells[0].revealed).toBe(false)
    expect(board.cells[2].revealed).toBe(false)
  })

  it('does nothing when the flag count differs from the number', () => {
    const playing = revealCell(createBoard(level), 1)
    const oneFlag = toggleFlag(playing, 0)

    expect(chordCell(oneFlag, 1)).toBe(oneFlag)
  })

  it('loses when a flag is on the wrong cell', () => {
    const playing = revealCell(createBoard(level), 1)
    const wrong = flagAll(playing, [0, 4]) // [2, 0] is a mine but is left unflagged

    const board = chordCell(wrong, 1)

    expect(board.state).toBe('lost')
    expect(board.cells[2].revealed).toBe(true)
  })

  it('does nothing on a hidden cell', () => {
    const playing = revealCell(createBoard(level), 1)
    const flagged = flagAll(playing, [0, 2])

    expect(chordCell(flagged, 4)).toBe(flagged)
  })

  it('does nothing on a revealed empty cell', () => {
    const playing = revealCell(createBoard(level), 7) // bottom row cascades
    expect(playing.cells[7].adjacent).toBe(0)

    expect(chordCell(playing, 7)).toBe(playing)
  })

  it('cascades through neighbours it reveals', () => {
    // 4x2, mine at [0, 0]:
    // * 1 0 0
    // 1 1 0 0
    const wide: Level = { ...level, width: 4, height: 2, mines: [[0, 0]] }
    const playing = toggleFlag(revealCell(createBoard(wide), 1), 0)

    const board = chordCell(playing, 1)

    expect(board.state).toBe('won')
  })
})
