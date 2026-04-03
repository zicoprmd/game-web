import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const GRID_SIZE = 8
const GEM_SIZE = 50
const GEM_COLORS = [
  { name: 'red', color: '#e74c3c', glow: '#ff6b6b' },
  { name: 'blue', color: '#3498db', glow: '#5dade2' },
  { name: 'green', color: '#2ecc71', glow: '#58d68d' },
  { name: 'yellow', color: '#f1c40f', glow: '#f7dc6f' },
  { name: 'purple', color: '#9b59b6', glow: '#bb8fce' },
  { name: 'orange', color: '#e67e22', glow: '#f0b27a' },
  { name: 'pink', color: '#e91e63', glow: '#f48fb1' }
]

function createInitialGrid() {
  let grid = []
  for (let r = 0; r < GRID_SIZE; r++) {
    let row = []
    for (let c = 0; c < GRID_SIZE; c++) {
      let colorIdx
      do {
        colorIdx = Math.floor(Math.random() * GEM_COLORS.length)
      } while (
        (c >= 2 && row[c - 1]?.colorIdx === colorIdx && row[c - 2]?.colorIdx === colorIdx) ||
        (r >= 2 && grid[r - 1]?.[c]?.colorIdx === colorIdx && grid[r - 2]?.[c]?.colorIdx === colorIdx)
      )
      row.push({ colorIdx, id: `${r}-${c}-${Date.now()}-${Math.random()}` })
    }
    grid.push(row)
  }
  return grid
}

function Bejeweled() {
  const [grid, setGrid] = useState([])
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('bejeweled_best')
    return saved ? parseInt(saved) : 0
  })
  const [moves, setMoves] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [combo, setCombo] = useState(0)
  const [matchedGems, setMatchedGems] = useState([])
  const gridRef = useRef([])

  useEffect(() => {
    gridRef.current = grid
  }, [grid])

  const startGame = useCallback(() => {
    setGrid(createInitialGrid())
    setScore(0)
    setMoves(0)
    setSelected(null)
    setIsProcessing(false)
    setGameStarted(true)
    setCombo(0)
    setMatchedGems([])
  }, [])

  useEffect(() => {
    if (!gameStarted) {
      startGame()
    }
  }, [gameStarted, startGame])

  const findMatches = useCallback((grid) => {
    const matches = new Set()

    // Horizontal matches
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        if (grid[r][c] && grid[r][c + 1] && grid[r][c + 2]) {
          if (grid[r][c].colorIdx === grid[r][c + 1].colorIdx &&
              grid[r][c].colorIdx === grid[r][c + 2].colorIdx) {
            matches.add(`${r}-${c}`)
            matches.add(`${r}-${c + 1}`)
            matches.add(`${r}-${c + 2}`)
          }
        }
      }
    }

    // Vertical matches
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        if (grid[r][c] && grid[r + 1][c] && grid[r + 2][c]) {
          if (grid[r][c].colorIdx === grid[r + 1][c].colorIdx &&
              grid[r][c].colorIdx === grid[r + 2][c].colorIdx) {
            matches.add(`${r}-${c}`)
            matches.add(`${r + 1}-${c}`)
            matches.add(`${r + 2}-${c}`)
          }
        }
      }
    }

    return Array.from(matches).map(s => {
      const [r, c] = s.split('-').map(Number)
      return { row: r, col: c }
    })
  }, [])

  const removeMatches = useCallback((grid, matches) => {
    const newGrid = grid.map(row => [...row])
    matches.forEach(({ row, col }) => {
      newGrid[row][col] = null
    })
    return newGrid
  }, [])

  const dropGems = useCallback((grid) => {
    const newGrid = grid.map(row => [...row])

    for (let c = 0; c < GRID_SIZE; c++) {
      let emptySpots = 0
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (newGrid[r][c] === null) {
          emptySpots++
        } else if (emptySpots > 0) {
          newGrid[r + emptySpots][c] = newGrid[r][c]
          newGrid[r][c] = null
        }
      }

      for (let r = 0; r < emptySpots; r++) {
        const colorIdx = Math.floor(Math.random() * GEM_COLORS.length)
        newGrid[r][c] = { colorIdx, id: `${r}-${c}-${Date.now()}-${Math.random()}` }
      }
    }

    return newGrid
  }, [])

  const processMatches = useCallback(async () => {
    let currentGrid = [...gridRef.current.map(row => [...row])]
    let matchCount = 0

    while (true) {
      const matches = findMatches(currentGrid)
      if (matches.length === 0) break

      matchCount++
      setMatchedGems(matches)

      await new Promise(resolve => setTimeout(resolve, 200))

      const newScore = score + matches.length * 10 * matchCount
      setScore(newScore)
      if (newScore > bestScore) {
        setBestScore(newScore)
        localStorage.setItem('bejeweled_best', newScore.toString())
      }

      currentGrid = removeMatches(currentGrid, matches)
      setGrid([...currentGrid])
      gridRef.current = currentGrid

      await new Promise(resolve => setTimeout(resolve, 200))

      currentGrid = dropGems(currentGrid)
      setGrid([...currentGrid])
      gridRef.current = currentGrid

      await new Promise(resolve => setTimeout(resolve, 200))
      setMatchedGems([])
    }

    setMoves(m => m + 1)
    setCombo(matchCount > 1 ? matchCount : 0)
    setIsProcessing(false)
  }, [findMatches, removeMatches, dropGems, score, bestScore])

  const handleGemClick = useCallback((row, col) => {
    if (isProcessing) return

    if (!selected) {
      setSelected({ row, col })
      return
    }

    const isAdjacent =
      (Math.abs(selected.row - row) === 1 && selected.col === col) ||
      (Math.abs(selected.col - col) === 1 && selected.row === row)

    if (!isAdjacent) {
      setSelected({ row, col })
      return
    }

    setIsProcessing(true)
    const newGrid = grid.map(row => [...row])
    const temp = newGrid[selected.row][selected.col]
    newGrid[selected.row][selected.col] = newGrid[row][col]
    newGrid[row][col] = temp

    const matches = findMatches(newGrid)
    if (matches.length === 0) {
      newGrid[row][col] = newGrid[selected.row][selected.col]
      newGrid[selected.row][selected.col] = temp
      setGrid([...newGrid])
      gridRef.current = newGrid
      setSelected(null)
      setIsProcessing(false)
      return
    }

    setGrid([...newGrid])
    gridRef.current = newGrid
    setSelected(null)

    setTimeout(() => {
      processMatches()
    }, 100)
  }, [selected, grid, isProcessing, findMatches, processMatches])

  const isSelected = useCallback((row, col) => {
    return selected && selected.row === row && selected.col === col
  }, [selected])

  const isMatched = useCallback((row, col) => {
    return matchedGems.some(g => g.row === row && g.col === col)
  }, [matchedGems])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Bejeweled</h1>

      {/* Score Display */}
      <div className="flex gap-8 mb-4">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Score</p>
          <p className="text-2xl font-bold text-yellow-400">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Best</p>
          <p className="text-2xl font-bold text-green-400">{bestScore}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Moves</p>
          <p className="text-2xl font-bold">{moves}</p>
        </div>
      </div>

      {combo > 1 && (
        <div className="bg-yellow-600 px-4 py-2 rounded-lg mb-4 animate-pulse">
          <p className="font-bold">Combo x{combo}!</p>
        </div>
      )}

      {/* Game Grid */}
      <div
        className="relative bg-gray-800 p-3 rounded-xl shadow-2xl"
        style={{
          width: GRID_SIZE * GEM_SIZE + 24,
          height: GRID_SIZE * GEM_SIZE + 24
        }}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((gem, colIndex) => {
              const gemData = gem ? GEM_COLORS[gem.colorIdx] : null
              const selectedThis = isSelected(rowIndex, colIndex)
              const matchedThis = isMatched(rowIndex, colIndex)

              return (
                <button
                  key={gem?.id || `${rowIndex}-${colIndex}`}
                  onClick={() => gem && handleGemClick(rowIndex, colIndex)}
                  disabled={isProcessing || !gem}
                  className={`
                    relative w-12 h-12 sm:w-14 sm:h-14
                    flex items-center justify-center
                    transition-all duration-150
                    ${selectedThis ? 'scale-110 z-10' : ''}
                    ${matchedThis ? 'scale-90 opacity-50' : ''}
                  `}
                  style={{
                    width: GEM_SIZE,
                    height: GEM_SIZE
                  }}
                >
                  {gemData && (
                    <div
                      className={`
                        w-10 h-10 sm:w-12 sm:h-12
                        rounded-full
                        transition-all duration-200
                        ${selectedThis ? 'ring-4 ring-white shadow-lg' : ''}
                        ${matchedThis ? 'animate-bounce' : ''}
                      `}
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${gemData.glow}, ${gemData.color})`,
                        boxShadow: selectedThis
                          ? `0 0 20px ${gemData.glow}, 0 0 40px ${gemData.glow}`
                          : `0 4px 8px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3)`,
                        border: `2px solid ${gemData.glow}`
                      }}
                    >
                      {/* Gem shine effect */}
                      <div
                        className="absolute top-1 left-2 w-3 h-2 rounded-full bg-white opacity-60"
                        style={{ transform: 'rotate(-30deg)' }}
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-gray-400">
        <p>Click a gem, then click an adjacent gem to swap</p>
        <p className="text-sm mt-1">Match 3 or more gems of the same color!</p>
      </div>

      {/* New Game */}
      <button
        onClick={startGame}
        className="mt-4 bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        New Game
      </button>
    </div>
  )
}

export default Bejeweled
