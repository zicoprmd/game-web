import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
]

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isX, setIsX] = useState(true)
  const [winner, setWinner] = useState(null)
  const [isVsComputer, setIsVsComputer] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const checkWinner = (newBoard) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a]
      }
    }
    return null
  }

  const getEmptyIndices = (newBoard) => {
    return newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null)
  }

  const minimax = (newBoard, depth, isMaximizing) => {
    const winner = checkWinner(newBoard)
    if (winner === 'O') return 10 - depth
    if (winner === 'X') return depth - 10
    if (getEmptyIndices(newBoard).length === 0) return 0

    const emptyIndices = getEmptyIndices(newBoard)

    if (isMaximizing) {
      let best = -Infinity
      for (const idx of emptyIndices) {
        const boardCopy = [...newBoard]
        boardCopy[idx] = 'O'
        best = Math.max(best, minimax(boardCopy, depth + 1, false))
      }
      return best
    } else {
      let best = Infinity
      for (const idx of emptyIndices) {
        const boardCopy = [...newBoard]
        boardCopy[idx] = 'X'
        best = Math.min(best, minimax(boardCopy, depth + 1, true))
      }
      return best
    }
  }

  const getComputerMove = (newBoard) => {
    let bestMove = null
    let bestValue = -Infinity

    for (const idx of getEmptyIndices(newBoard)) {
      const boardCopy = [...newBoard]
      boardCopy[idx] = 'O'
      const moveValue = minimax(boardCopy, 0, false)
      if (moveValue > bestValue) {
        bestValue = moveValue
        bestMove = idx
      }
    }

    return bestMove
  }

  const handleClick = (index) => {
    if (board[index] || winner || !isPlaying) return

    const newBoard = [...board]
    newBoard[index] = isX ? 'X' : 'O'
    setBoard(newBoard)

    const gameWinner = checkWinner(newBoard)
    if (gameWinner) {
      setWinner(gameWinner)
      return
    }

    if (newBoard.every(cell => cell !== null)) {
      setWinner('draw')
      return
    }

    if (isVsComputer) {
      setIsX(false)
    } else {
      setIsX(!isX)
    }
  }

  useEffect(() => {
    if (isVsComputer && !isX && !winner && isPlaying) {
      const timer = setTimeout(() => {
        const computerMove = getComputerMove(board)
        if (computerMove !== null) {
          const newBoard = [...board]
          newBoard[computerMove] = 'O'
          setBoard(newBoard)

          const gameWinner = checkWinner(newBoard)
          if (gameWinner) {
            setWinner(gameWinner)
            return
          }
          setIsX(true)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isX, isVsComputer, winner, isPlaying, board])

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setIsX(true)
    setWinner(null)
  }

  const startGame = (vsComputer) => {
    setIsVsComputer(vsComputer)
    setIsPlaying(true)
    resetGame()
  }

  const isDraw = winner === 'draw'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-8">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Tic Tac Toe</h1>

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400 mb-4">Choose game mode:</p>
          <div className="flex gap-4">
            <button
              onClick={() => startGame(false)}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              2 Players
            </button>
            <button
              onClick={() => startGame(true)}
              className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              vs Computer
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <span className={`px-3 py-1 rounded ${isVsComputer ? 'bg-green-600' : 'bg-blue-600'}`}>
              {isVsComputer ? 'vs Computer' : '2 Players'}
            </span>
          </div>

          <p className="text-gray-400 mb-8">
            {winner ? winner === 'draw' ? "It's a draw!" : `Player ${winner} wins!` : `Player ${isX ? 'X' : 'O'}'s turn`}
            {isVsComputer && !isX && !winner && isPlaying && ' (Computer thinking...)'}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-8">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleClick(index)}
                className={`w-24 h-24 bg-gray-700 rounded-lg text-4xl font-bold transition-colors
                  ${cell ? 'hover:bg-gray-700' : 'hover:bg-gray-600'}
                  ${!cell && !winner && isPlaying && !(!isX && isVsComputer) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                disabled={!!cell || !!winner || (!isX && isVsComputer && isPlaying)}
              >
                {cell}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Reset Game
            </button>
            <button
              onClick={() => { setIsPlaying(false); setWinner(null) }}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Change Mode
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default TicTacToe
