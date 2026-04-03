import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const GRID_SIZE = 4
const TILE_COUNT = GRID_SIZE * GRID_SIZE
const CELL_SIZE = 80
const GAP = 6

const TILE_COLORS = {
  1: '#f5e6d3', 2: '#f5d6a8', 3: '#f5c87a', 4: '#f5b84c',
  5: '#f5aa2e', 6: '#f59c1e', 7: '#f08e0e', 8: '#e88000',
  9: '#d46a00', 10: '#c05500', 11: '#ac4000', 12: '#982b00',
  13: '#841600', 14: '#700100', 15: '#5c0000'
}

function shuffleArray(arr) {
  const newArr = [...arr]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

function isSolvable(tiles) {
  let inversions = 0
  const flat = tiles.filter(t => t !== 0)
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i] > flat[j]) inversions++
    }
  }
  const emptyRow = Math.floor(tiles.indexOf(0) / GRID_SIZE)
  const fromBottom = GRID_SIZE - emptyRow
  if (GRID_SIZE % 2 === 1) {
    return inversions % 2 === 0
  }
  return (inversions + fromBottom) % 2 === 1
}

function isGoalState(tiles) {
  for (let i = 0; i < TILE_COUNT - 1; i++) {
    if (tiles[i] !== i + 1) return false
  }
  return tiles[TILE_COUNT - 1] === 0
}

function getEmptyIndex(tiles) {
  return tiles.indexOf(0)
}

function getMovableTiles(tiles) {
  const emptyIdx = getEmptyIndex(tiles)
  const emptyRow = Math.floor(emptyIdx / GRID_SIZE)
  const emptyCol = emptyIdx % GRID_SIZE
  const movable = []

  if (emptyRow > 0) movable.push(emptyIdx - GRID_SIZE)
  if (emptyRow < GRID_SIZE - 1) movable.push(emptyIdx + GRID_SIZE)
  if (emptyCol > 0) movable.push(emptyIdx - 1)
  if (emptyCol < GRID_SIZE - 1) movable.push(emptyIdx + 1)

  return movable
}

function canMove(tiles, index) {
  return getMovableTiles(tiles).includes(index)
}

function moveTile(tiles, index) {
  if (!canMove(tiles, index)) return tiles
  const newTiles = [...tiles]
  const emptyIdx = getEmptyIndex(tiles)
  ;[newTiles[index], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[index]]
  return newTiles
}

function getInitialTiles() {
  let tiles
  do {
    tiles = shuffleArray([...Array(TILE_COUNT).keys()])
  } while (!isSolvable(tiles) || isGoalState(tiles))
  return tiles
}

export default function SlidingPuzzle() {
  const [tiles, setTiles] = useState(getInitialTiles)
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [time, setTime] = useState(0)
  const [bestMoves, setBestMoves] = useState(() => {
    const saved = localStorage.getItem('sliding_best_moves')
    return saved ? parseInt(saved) : null
  })
  const [bestTime, setBestTime] = useState(() => {
    const saved = localStorage.getItem('sliding_best_time')
    return saved ? parseInt(saved) : null
  })
  const timerRef = useRef(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      setTime(t => t + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetGame = useCallback(() => {
    stopTimer()
    setTiles(getInitialTiles())
    setMoves(0)
    setTime(0)
    setGameWon(false)
  }, [stopTimer])

  const handleTileClick = useCallback((index) => {
    if (gameWon) return
    if (!canMove(tiles, index)) return

    startTimer()
    const newTiles = moveTile(tiles, index)
    setTiles(newTiles)
    setMoves(m => m + 1)

    if (isGoalState(newTiles)) {
      stopTimer()
      setGameWon(true)

      if (bestMoves === null || moves + 1 < bestMoves) {
        setBestMoves(moves + 1)
        localStorage.setItem('sliding_best_moves', (moves + 1).toString())
      }
      if (bestTime === null || time < bestTime) {
        setBestTime(time)
        localStorage.setItem('sliding_best_time', time.toString())
      }
    }
  }, [tiles, gameWon, moves, time, bestMoves, bestTime, startTimer, stopTimer])

  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const movableTiles = getMovableTiles(tiles)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Sliding Puzzle</h1>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Moves</p>
            <p className="text-2xl font-bold">{moves}</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Time</p>
            <p className="text-2xl font-bold">{formatTime(time)}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 text-sm text-gray-400">
          <div>
            <span>Best: </span>
            <span className="text-white font-semibold">
              {bestMoves !== null ? `${bestMoves} moves` : '--'}
            </span>
          </div>
          <div>
            <span>Best Time: </span>
            <span className="text-white font-semibold">
              {bestTime !== null ? formatTime(bestTime) : '--'}
            </span>
          </div>
        </div>

        {gameWon && (
          <div className="bg-green-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-3xl font-bold mb-2">Puzzle Solved!</p>
            <p className="text-lg mb-4">
              {moves} moves in {formatTime(time)}
            </p>
            <button
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gap: `${GAP}px`,
            padding: `${GAP}px`,
            backgroundColor: '#2d3748',
            borderRadius: '12px',
            width: 'fit-content',
            margin: '0 auto',
          }}
        >
          {tiles.map((value, index) => {
            const isMovable = movableTiles.includes(index)
            return (
              <button
                key={index}
                onClick={() => handleTileClick(index)}
                disabled={value === 0}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: value === 0 ? '#1a202c' : (TILE_COLORS[value] || '#718096'),
                  color: value === 0 ? 'transparent' : '#1a202c',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  cursor: value === 0 ? 'default' : 'pointer',
                  border: isMovable && value !== 0 ? '3px solid #63b3ed' : '3px solid transparent',
                  transition: 'transform 0.1s, border-color 0.2s',
                  transform: isMovable && value !== 0 ? 'scale(1.02)' : 'scale(1)',
                  opacity: value === 0 ? 0.3 : 1,
                }}
                className={isMovable && value !== 0 ? 'hover:brightness-110' : ''}
              >
                {value || ''}
              </button>
            )
          })}
        </div>

        <div className="mt-6 text-center text-gray-400">
          <p className="mb-2">Click a tile next to the empty space to slide it</p>
          <p className="text-sm">Arrange numbers 1-15 in order</p>
          <button
            onClick={resetGame}
            className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}
