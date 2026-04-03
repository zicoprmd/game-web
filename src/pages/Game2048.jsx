import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

const GRID_SIZE = 4
const CELL_SIZE = 80
const GAP = 10

const TILE_COLORS = {
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#f9f6f2' },
  16: { bg: '#f59563', text: '#f9f6f2' },
  32: { bg: '#f67c5f', text: '#f9f6f2' },
  64: { bg: '#f65e3b', text: '#f9f6f2' },
  128: { bg: '#edcf72', text: '#f9f6f2' },
  256: { bg: '#edcc61', text: '#f9f6f2' },
  512: { bg: '#edc850', text: '#f9f6f2' },
  1024: { bg: '#edc53f', text: '#f9f6f2' },
  2048: { bg: '#edc22e', text: '#f9f6f2' },
  super: { bg: '#3c3a32', text: '#f9f6f2' },
}

function getEmptyGrid() {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
}

function addRandomTile(grid) {
  const emptyCells = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) emptyCells.push({ r, c })
    }
  }
  if (emptyCells.length === 0) return grid

  const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  const newGrid = grid.map(row => [...row])
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4
  return newGrid
}

function transpose(grid) {
  const result = getEmptyGrid()
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      result[c][r] = grid[r][c]
    }
  }
  return result
}

function reverseRow(row) {
  return [...row].reverse()
}

function slideRowLeft(row) {
  const filtered = row.filter(val => val !== 0)
  const merged = []
  let score = 0
  let i = 0

  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const newVal = filtered[i] * 2
      merged.push(newVal)
      score += newVal
      i += 2
    } else {
      merged.push(filtered[i])
      i++
    }
  }

  while (merged.length < GRID_SIZE) merged.push(0)
  return { row: merged, score }
}

function slideRowRight(row) {
  const reversed = reverseRow(row)
  const { row: slidRow, score } = slideRowLeft(reversed)
  return { row: reverseRow(slidRow), score }
}

function slideGridLeft(grid) {
  let totalScore = 0
  const newGrid = grid.map(row => {
    const { row: newRow, score } = slideRowLeft(row)
    totalScore += score
    return newRow
  })
  return { grid: newGrid, score: totalScore }
}

function slideGridRight(grid) {
  let totalScore = 0
  const newGrid = grid.map(row => {
    const { row: newRow, score } = slideRowRight(row)
    totalScore += score
    return newRow
  })
  return { grid: newGrid, score: totalScore }
}

function slideGridUp(grid) {
  const transposed = transpose(grid)
  const { grid: slidTransposed, score } = slideGridLeft(transposed)
  return { grid: transpose(slidTransposed), score }
}

function slideGridDown(grid) {
  const transposed = transpose(grid)
  const { grid: slidTransposed, score } = slideGridRight(transposed)
  return { grid: transpose(slidTransposed), score }
}

function move(grid, direction) {
  switch (direction) {
    case 'left': return slideGridLeft(grid)
    case 'right': return slideGridRight(grid)
    case 'up': return slideGridUp(grid)
    case 'down': return slideGridDown(grid)
    default: return { grid, score: 0 }
  }
}

function canMove(grid) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true
    }
  }
  return false
}

function Game2048() {
  const [grid, setGrid] = useState(() => addRandomTile(addRandomTile(getEmptyGrid())))
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('game2048_best')
    return saved ? parseInt(saved) : 0
  })
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)

  const resetGame = useCallback(() => {
    setGrid(addRandomTile(addRandomTile(getEmptyGrid())))
    setScore(0)
    setGameOver(false)
    setWon(false)
  }, [])

  const handleMove = useCallback((direction) => {
    if (gameOver || won) return

    const { grid: newGrid, score: gainedScore } = move(grid, direction)

    if (JSON.stringify(newGrid) === JSON.stringify(grid)) return

    const gridWithTile = addRandomTile(newGrid)
    setGrid(gridWithTile)

    const newScore = score + gainedScore
    setScore(newScore)

    if (newScore > bestScore) {
      setBestScore(newScore)
      localStorage.setItem('game2048_best', newScore.toString())
    }

    if (gridWithTile.some(row => row.some(val => val >= 2048))) {
      setWon(true)
    }

    if (!canMove(gridWithTile)) {
      setGameOver(true)
    }
  }, [grid, score, bestScore, gameOver, won])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const keyMap = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      }
      const direction = keyMap[e.key]
      if (direction) {
        e.preventDefault()
        handleMove(direction)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleMove])

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
    gap: `${GAP}px`,
    padding: `${GAP}px`,
    backgroundColor: '#bbada0',
    borderRadius: '8px',
    width: 'fit-content',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">2048</h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Score</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Best</p>
            <p className="text-2xl font-bold">{bestScore}</p>
          </div>
        </div>

        {(gameOver || won) && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-3xl font-bold mb-4">{won ? 'You Win!' : 'Game Over!'}</p>
            <button
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        <div style={gridStyle}>
          {grid.flat().map((value, index) => {
            const color = TILE_COLORS[value] || TILE_COLORS.super
            return (
              <div
                key={index}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: value === 0 ? '#cdc1b4' : color.bg,
                  color: value === 0 ? '#cdc1b4' : color.text,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: value >= 100 ? '24px' : '32px',
                  fontWeight: 'bold',
                }}
              >
                {value || ''}
              </div>
            )
          })}
        </div>

        <div className="mt-6 text-center text-gray-400">
          <p className="mb-2">Use arrow keys or WASD to move tiles</p>
          <button
            onClick={resetGame}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}

export default Game2048
