import { revealCell, type Board } from './board'
import { neighboursOf } from './grid'

// Chording: on a revealed numbered cell whose flagged neighbours match the
// number, reveal every other hidden neighbour. A misplaced flag loses the game.
export function chordCell(board: Board, index: number): Board {
  const cell = board.cells[index]
  if (board.state !== 'playing' || cell === undefined || !cell.revealed || cell.adjacent === 0) {
    return board
  }

  const neighbours = neighboursOf(index, board.width, board.height)
  const flags = neighbours.filter((n) => board.cells[n].flagged).length
  if (flags !== cell.adjacent) {
    return board
  }

  let next = board
  for (const n of neighbours) {
    if (next.state !== 'playing') break
    next = revealCell(next, n)
  }
  return next
}
