import type { Level } from '../logic/board'
import './LevelSelect.scss'

type Props = {
  levels: Level[]
  value: string
  onChange: (id: string) => void
}

export function LevelSelect({ levels, value, onChange }: Props) {
  return (
    <label className="level-select">
      <span className="level-select__label">Plansza</span>
      <select
        className="level-select__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {levels.map((level) => (
          <option key={level.id} value={level.id}>
            {level.name} ({level.width}×{level.height})
          </option>
        ))}
      </select>
    </label>
  )
}
