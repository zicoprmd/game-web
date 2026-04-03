import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

const ROWS = 6
const COLS = 7
const EMPTY = null

const WINNING_COMBOS = []

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    WINNING_COMBOS.push([r, c, r, c + 1, r, c + 2, r, c + 3])
    WINNING_COMBOS.push([r, c, r + 1, c, r + 2, c, r + 3])
    WINNING_COMBOS.push([r, c, r + 1, c + 1, r + 2, c + 2, r + 3, c + 3])
    WINNING_COMBOS.push([r, c, r + 1, c - 1, r + 2, c - 2, r + 3, c - 3])
  }
}

function ConnectFour() {
  const [board, setBoard] = useState(() => Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)))
  const [currentPlayer, setCurrentPlayer] = useState('red')
  const [winner, setWinner] = useState(null)
  const [winningCells, setWinningCells] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)

  const checkWinner = useCallback((newBoard, row, col, player) => {
    const directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 }
    ]

    for (const { dr, dc } of directions) {
      let cells = [[row, col]]

      for (let i = 1; i < 4; i++) {
        const r = row + dr * i
        const c = col + dc * i
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && newBoard[r][c] === player) {
          cells.push([r, c])
        } else break
      }

      for (let i = 1; i < 4; i++) {
        const r = row - dr * i
        const c = col - dc * i
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && newBoard[r][c] === player) {
          cells.push([r, c])
        } else break
      }

      if (cells.length >= 4) return cells.slice(0, 4)
    }

    return null
  }, [])

  const getLowestEmptyRow = useCallback((col) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === EMPTY) return r
    }
    return -1
  }, [board])

  const handleClick = (col) => {
    if (winner || !isPlaying) return

    const row = getLowestEmptyRow(col)
    if (row === -1) return

    const newBoard = board.map(r => [...r])
    newBoard[row][col] = currentPlayer
    setBoard(newBoard)

    const winCells = checkWinner(newBoard, row, col, currentPlayer)
    if (winCells) {
      setWinner(currentPlayer)
      setWinningCells(winCells)
      return
    }

    if (newBoard.every(r => r.every(c => c !== EMPTY))) {
      setWinner('draw')
      return
    }

    setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red')
  }

  const resetGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)))
    setCurrentPlayer('red')
    setWinner(null)
    setWinningCells([])
    setIsPlaying(false)
  }

  const startGame = () => {
    resetGame()
    setIsPlaying(true)
  }

  const Cell = ({ row, col }) => {
    const value = board[row][col]
    const isWinningCell = winningCells.some(([r, c]) => r === row && c === col)

    return (
      <div
        onClick={() => handleClick(col)}
        className={`
          w-12 h-12 rounded-full border-4 border-blue-800
          ${!winner && isPlaying ? 'cursor-pointer hover:bg-blue-900/50' : 'cursor-not-allowed'}
          transition-colors duration-200
        `}
      >
        <div
          className={`
            w-full h-full rounded-full transition-transform duration-300
            ${value === 'red' ? 'bg-red-500' : value === 'yellow' ? 'bg-yellow-400' : 'bg-transparent'}
            ${isWinningCell ? 'scale-110 shadow-lg shadow-white/50' : ''}
          `}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Connect Four</h1>

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-gray-400 mb-2">Drop discs to connect four in a row!</p>
          <button
            onClick={startGame}
            className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-6 h-6 rounded-full ${currentPlayer === 'red' ? 'bg-red-500' : 'bg-yellow-400'}`} />
            <span className="text-lg">
              {winner ? winner === 'draw' ? "It's a draw!" : `Player ${winner} wins!` : `Player ${currentPlayer}'s turn`}
            </span>
          </div>

          <div className="bg-blue-700 p-4 rounded-xl">
            <div className="flex gap-1 mb-1">
              {Array(COLS).fill(null).map((_, col) => (
                <div key={col} className="w-12" />
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {row.map((_, colIndex) => (
                    <Cell key={colIndex} row={rowIndex} col={colIndex} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => { resetGame(); setIsPlaying(false) }}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Main Menu
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ConnectFour
