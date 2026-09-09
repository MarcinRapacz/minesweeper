export function isInside(x: number, y: number, width: number, height: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < width && y >= 0 && y < height
}

export function neighboursOf(index: number, width: number, height: number): number[] {
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
