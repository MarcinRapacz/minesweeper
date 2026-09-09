import type { Board as BoardData } from '../logic/board'
import { Cell } from './Cell'
import './Board.scss'

type Props = {
  board: BoardData
  onReveal: (index: number) => void
  onFlag: (index: number) => void
}

export function Board({ board, onReveal, onFlag }: Props) {
  const lost = board.state === 'lost'
  return (
    <div
      className="board"
      style={{ gridTemplateColumns: `repeat(${board.width}, var(--cell-size))` }}
    >
      {board.cells.map((cell, index) => (
        <Cell key={index} cell={cell} index={index} lost={lost} onReveal={onReveal} onFlag={onFlag} />
      ))}
    </div>
  )
}
