import { useState } from 'react'
import { createBoard, revealCell, toggleFlag, type Board, type Level } from '../logic/board'
import { chordCell } from '../logic/chord'

type GameState = {
  level: Level
  board: Board
}

export function useGame(levels: Level[], initial: Level) {
  const [game, setGame] = useState<GameState>(() => ({ level: initial, board: createBoard(initial) }))

  const selectLevel = (id: string) => {
    const level = levels.find((candidate) => candidate.id === id)
    if (level) {
      setGame({ level, board: createBoard(level) })
    }
  }

  const restart = () => {
    setGame(({ level }) => ({ level, board: createBoard(level) }))
  }

  // Left click: reveal a hidden cell, chord on a revealed one.
  const reveal = (index: number) => {
    setGame(({ level, board }) => ({
      level,
      board: board.cells[index]?.revealed ? chordCell(board, index) : revealCell(board, index),
    }))
  }

  const flag = (index: number) => {
    setGame(({ level, board }) => ({ level, board: toggleFlag(board, index) }))
  }

  const mines = game.board.cells.filter((cell) => cell.mine).length
  const flags = game.board.cells.filter((cell) => cell.flagged).length

  return { level: game.level, board: game.board, minesLeft: mines - flags, selectLevel, restart, reveal, flag }
}
