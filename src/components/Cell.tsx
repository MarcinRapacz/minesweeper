import type { Cell as CellData } from '../logic/board'

type Props = {
  cell: CellData
  index: number
  lost: boolean
  onReveal: (index: number) => void
  onFlag: (index: number) => void
}

function content(cell: CellData, lost: boolean): string {
  if (cell.flagged) return '⚑'
  if (cell.mine && (cell.revealed || lost)) return '✹'
  if (cell.revealed && cell.adjacent > 0) return String(cell.adjacent)
  return ''
}

function classNames(cell: CellData, lost: boolean): string {
  const classes = ['board__cell']
  if (cell.revealed) classes.push('board__cell--revealed')
  if (cell.flagged) classes.push('board__cell--flagged')
  if (cell.mine && (cell.revealed || lost)) classes.push('board__cell--mine')
  if (cell.revealed && cell.adjacent > 0) classes.push(`board__cell--adjacent-${cell.adjacent}`)
  return classes.join(' ')
}

export function Cell({ cell, index, lost, onReveal, onFlag }: Props) {
  return (
    <button
      type="button"
      className={classNames(cell, lost)}
      onClick={() => onReveal(index)}
      onContextMenu={(event) => {
        event.preventDefault()
        onFlag(index)
      }}
    >
      {content(cell, lost)}
    </button>
  )
}
