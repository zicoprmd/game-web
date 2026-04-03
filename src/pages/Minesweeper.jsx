import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'

const GRID_SIZE = 9
const MINE_COUNT = 10

function createBoard() {
  const board = Array(GRID_SIZE).fill(null).map(() =>
    Array(GRID_SIZE).fill(null).map(() => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborCount: 0,
    }))
  )

  let minesPlaced = 0
  while (minesPlaced < MINE_COUNT) {
    const r = Math.floor(Math.random() * GRID_SIZE)
    const c = Math.floor(Math.random() * GRID_SIZE)
    if (!board[r][c].isMine) {
      board[r][c].isMine = true
      minesPlaced++
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c].isMine) continue
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && board[nr][nc].isMine) {
            count++
          }
        }
      }
      board[r][c].neighborCount = count
    }
  }

  return board
}

function floodFill(board, startR, startC) {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })))
  const queue = [[startR, startC]]
  const visited = new Set()

  while (queue.length > 0) {
    const [r, c] = queue.shift()
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue
    if (visited.has(`${r},${c}`)) continue
    if (newBoard[r][c].isMine || newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) continue

    visited.add(`${r},${c}`)
    newBoard[r][c].isRevealed = true

    if (newBoard[r][c].neighborCount === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          queue.push([r + dr, c + dc])
        }
      }
    }
  }

  return newBoard
}

const NUMBER_COLORS = {
  1: '#63b3ed',
  2: '#68d391',
  3: '#f6ad55',
  4: '#fc8181',
  5: '#b794f4',
  6: '#4fd1c5',
  7: '#f687b3',
  8: '#a0aec0',
}

function getEmoji() {
  return '💣'
}

export default function Minesweeper() {
  const [board, setBoard] = useState(createBoard)
  const [gameState, setGameState] = useState('playing')
  const [flagsLeft, setFlagsLeft] = useState(MINE_COUNT)
  const [revealedCount, setRevealedCount] = useState(0)
  const [time, setTime] = useState(0)
  const [bestTime, setBestTime] = useState(() => {
    const saved = localStorage.getItem('minesweeper_best_time')
    return saved ? parseInt(saved) : null
  })
  const [firstClick, setFirstClick] = useState(true)

  const timerRef = useCallback(() => {
    if (gameState !== 'playing') return
    const interval = setInterval(() => {
      setTime(t => t + 1)
    }, 1000)
    return interval
  }, [gameState])

  const stopTimer = useCallback((interval) => {
    if (interval) clearInterval(interval)
  }, [])

  useEffect(() => {
    let interval
    if (gameState === 'playing' && !firstClick) {
      interval = setInterval(() => {
        setTime(t => t + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState, firstClick])

  const resetGame = useCallback(() => {
    setBoard(createBoard())
    setGameState('playing')
    setFlagsLeft(MINE_COUNT)
    setRevealedCount(0)
    setTime(0)
    setFirstClick(true)
  }, [])

  const handleCellClick = useCallback((r, c) => {
    if (gameState !== 'playing') return
    if (board[r][c].isRevealed || board[r][c].isFlagged) return

    let newBoard

    if (firstClick) {
      while (board[r][c].isMine || board[r][c].neighborCount > 0) {
        newBoard = createBoard()
      }
      setFirstClick(false)
    }

    if (newBoard) {
      const clicked = newBoard[r][c]
      if (clicked.isMine) {
        setBoard(newBoard.map(row => row.map(cell => ({ ...cell, isRevealed: true }))))
        setGameState('lost')
        return
      }

      newBoard = floodFill(newBoard, r, c)
      setBoard(newBoard)
      const revealed = newBoard.flat().filter(cell => cell.isRevealed).length
      setRevealedCount(revealed)

      if (revealed === GRID_SIZE * GRID_SIZE - MINE_COUNT) {
        setGameState('won')
        if (bestTime === null || time < bestTime) {
          setBestTime(time)
          localStorage.setItem('minesweeper_best_time', time.toString())
        }
      }
      return
    }

    if (board[r][c].isMine) {
      setBoard(board.map(row => row.map(cell => ({ ...cell, isRevealed: true }))))
      setGameState('lost')
      return
    }

    const newBoardCopy = floodFill(board, r, c)
    setBoard(newBoardCopy)
    const revealed = newBoardCopy.flat().filter(cell => cell.isRevealed).length
    setRevealedCount(revealed)

    if (revealed === GRID_SIZE * GRID_SIZE - MINE_COUNT) {
      setGameState('won')
      if (bestTime === null || time < bestTime) {
        setBestTime(time)
        localStorage.setItem('minesweeper_best_time', time.toString())
      }
    }
  }, [board, gameState, firstClick, time, bestTime])

  const handleRightClick = useCallback((e, r, c) => {
    e.preventDefault()
    if (gameState !== 'playing') return
    if (board[r][c].isRevealed) return

    const newBoard = board.map(row => row.map(cell => ({ ...cell })))
    if (newBoard[r][c].isFlagged) {
      newBoard[r][c].isFlagged = false
      setFlagsLeft(f => f + 1)
    } else {
      if (flagsLeft <= 0) return
      newBoard[r][c].isFlagged = true
      setFlagsLeft(f => f - 1)
    }
    setBoard(newBoard)
  }, [board, gameState, flagsLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Minesweeper</h1>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Flags</p>
            <p className="text-2xl font-bold">{flagsLeft}</p>
          </div>
          <button
            onClick={resetGame}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition-colors text-xl"
            style={{ fontFamily: 'monospace' }}
          >
            😃
          </button>
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Time</p>
            <p className="text-2xl font-bold">{formatTime(time)}</p>
          </div>
        </div>

        {bestTime !== null && (
          <div className="text-center mb-4 text-gray-400 text-sm">
            Best Time: <span className="text-white font-semibold">{formatTime(bestTime)}</span>
          </div>
        )}

        {gameState === 'won' && (
          <div className="bg-green-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-3xl font-bold mb-2">You Win!</p>
            <p className="text-lg mb-4">
              Cleared in {formatTime(time)}
            </p>
            <button
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="bg-red-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-3xl font-bold mb-2">Game Over!</p>
            <p className="text-lg mb-4">
              You hit a mine!
            </p>
            <button
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 40px)`,
            gap: '2px',
            padding: '8px',
            backgroundColor: '#4a5568',
            borderRadius: '8px',
            width: 'fit-content',
            margin: '0 auto',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
                disabled={gameState !== 'playing'}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: cell.isRevealed
                    ? cell.isMine ? '#e53e3e' : '#e2e8f0'
                    : cell.isFlagged ? '#f6ad55' : '#718096',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: gameState === 'playing' ? 'pointer' : 'default',
                  border: cell.isRevealed ? 'none' : '2px solid #4a5568',
                  color: cell.isRevealed && cell.neighborCount > 0
                    ? NUMBER_COLORS[cell.neighborCount] || '#1a202c'
                    : '#1a202c',
                }}
              >
                {cell.isRevealed && cell.isMine && '💣'}
                {cell.isRevealed && !cell.isMine && cell.neighborCount > 0 && cell.neighborCount}
                {!cell.isRevealed && cell.isFlagged && '🚩'}
              </button>
            ))
          )}
        </div>

        <div className="mt-6 text-center text-gray-400">
          <p className="mb-2">Left-click to reveal, right-click to flag</p>
          <p className="text-sm">Find all {MINE_COUNT} mines to win!</p>
        </div>
      </div>
    </div>
  )
}
