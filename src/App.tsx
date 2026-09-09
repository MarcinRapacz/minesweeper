import { Board } from './components/Board'
import { LevelSelect } from './components/LevelSelect'
import { levels } from './data/levels'
import { useGame } from './hooks/useGame'

const statusText = {
  idle: 'Odkryj pierwsze pole',
  playing: 'Gra trwa',
  won: 'Wygrana!',
  lost: 'Przegrana',
}

const firstLevel = levels[0]
if (firstLevel === undefined) {
  throw new Error('No levels defined')
}

export default function App() {
  const game = useGame(levels, firstLevel)

  return (
    <main className="game">
      <h1 className="game__title">Saper</h1>
      <header className="game__controls">
        <LevelSelect levels={levels} value={game.level.id} onChange={game.selectLevel} />
        <button type="button" className="game__restart" onClick={game.restart}>
          Od nowa
        </button>
      </header>
      <div className="game__status">
        <span className="game__mines">Miny: {game.minesLeft}</span>
        <span className={`game__result game__result--${game.board.state}`}>
          {statusText[game.board.state]}
        </span>
      </div>
      <Board board={game.board} onReveal={game.reveal} onFlag={game.flag} />
    </main>
  )
}
