import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const BOARD_SIZE = 8

function createInitialBoard() {
  const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))

  // Red pieces (top rows 0-2)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = { player: 'red', isKing: false }
      }
    }
  }

  // Black pieces (bottom rows 5-7)
  for (let r = 5; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = { player: 'black', isKing: false }
      }
    }
  }

  return board
}

function Checkers() {
  const [board, setBoard] = useState(createInitialBoard)
  const [currentPlayer, setCurrentPlayer] = useState('red')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [winner, setWinner] = useState(null)
  const [mustJump, setMustJump] = useState(null)
  const [moveHistory, setMoveHistory] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)

  const boardRef = useRef(board)
  useEffect(() => { boardRef.current = board }, [board])

  const cloneBoard = (b) => b.map(r => r.map(c => c ? { ...c } : null))

  const getValidMoves = useCallback((b, row, col, checkJumpsOnly = false) => {
    const piece = b[row][col]
    if (!piece) return []

    const moves = []
    const jumps = []

    // Red moves DOWN (+1), Black moves UP (-1)
    // Kings move both directions
    const directions = []
    if (piece.player === 'red' || piece.isKing) directions.push([1, -1], [1, 1])
    if (piece.player === 'black' || piece.isKing) directions.push([-1, -1], [-1, 1])

    for (const [dr, dc] of directions) {
      const nr = row + dr
      const nc = col + dc

      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        if (!b[nr][nc]) {
          moves.push({ row: nr, col: nc, isJump: false })
        } else if (b[nr][nc].player !== piece.player) {
          const jr = nr + dr
          const jc = nc + dc
          if (jr >= 0 && jr < BOARD_SIZE && jc >= 0 && jc < BOARD_SIZE && !b[jr][jc]) {
            jumps.push({ row: jr, col: jc, jumpedRow: nr, jumpedCol: nc, isJump: true })
          }
        }
      }
    }

    // If checkJumpsOnly is true, return only jumps (for mandatory jump check)
    if (checkJumpsOnly) return jumps
    // If there are jumps available, must jump (mandatory capture rule)
    if (jumps.length > 0) return jumps
    return moves
  }, [])

  const getAllJumpsForPlayer = useCallback((b, player) => {
    const jumps = []
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = b[r][c]
        if (piece && piece.player === player) {
          const pieceJumps = getValidMoves(b, r, c, true)
          if (pieceJumps.length > 0) {
            jumps.push(...pieceJumps.map(j => ({ ...j, fromRow: r, fromCol: c })))
          }
        }
      }
    }
    return jumps
  }, [getValidMoves])

  const handleSquareClick = (row, col) => {
    if (winner || !isPlaying) return

    const piece = board[row][col]

    if (selectedSquare) {
      const [fromRow, fromCol] = selectedSquare

      // Check if clicking on a valid move destination
      if (validMoves.some(m => m.row === row && m.col === col)) {
        const movingPiece = board[fromRow][fromCol]
        let nb = cloneBoard(board)
        nb[row][col] = { ...movingPiece }

        // King promotion
        if (movingPiece.player === 'red' && row === BOARD_SIZE - 1) nb[row][col].isKing = true
        if (movingPiece.player === 'black' && row === 0) nb[row][col].isKing = true

        nb[fromRow][fromCol] = null

        const moveData = validMoves.find(m => m.row === row && m.col === col)

        // Handle capture
        if (moveData?.isJump) {
          nb[moveData.jumpedRow][moveData.jumpedCol] = null

          // Check for additional jumps (multi-jump)
          const furtherJumps = getValidMoves(nb, row, col, true)
          if (furtherJumps.length > 0) {
            setBoard(nb)
            setSelectedSquare([row, col])
            setValidMoves(furtherJumps)
            return
          }
        }

        // Record move
        const fromNotation = `${String.fromCharCode(97 + fromCol)}${BOARD_SIZE - fromRow}`
        const toNotation = `${String.fromCharCode(97 + col)}${BOARD_SIZE - row}`
        const moveStr = `${movingPiece.player === 'red' ? 'R' : 'B'}: ${fromNotation}-${toNotation}${moveData?.isJump ? 'x' : ''}`
        setMoveHistory(prev => [...prev, moveStr])

        // Switch player
        const nextPlayer = currentPlayer === 'red' ? 'black' : 'red'

        // Check for winner
        let opponentCount = 0
        let opponentHasMoves = false
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (nb[r][c] && nb[r][c].player === nextPlayer) {
              opponentCount++
              if (getValidMoves(nb, r, c, false).length > 0) opponentHasMoves = true
            }
          }
        }

        if (opponentCount === 0 || !opponentHasMoves) {
          setWinner(currentPlayer)
        }

        // Check if next player must jump
        const nextJumps = getAllJumpsForPlayer(nb, nextPlayer)

        setBoard(nb)
        setCurrentPlayer(nextPlayer)
        setSelectedSquare(null)
        setValidMoves([])
        setMustJump(nextJumps.length > 0 ? nextJumps[0] : null)
      }
      // If clicking on own piece, select it instead
      else if (piece && piece.player === currentPlayer) {
        // Check if mandatory jump applies
        if (mustJump) {
          const pieceJumps = getValidMoves(board, row, col, true)
          if (pieceJumps.length > 0) {
            setSelectedSquare([row, col])
            setValidMoves(pieceJumps)
          }
        } else {
          setSelectedSquare([row, col])
          setValidMoves(getValidMoves(board, row, col, false))
        }
      }
      // Clicking elsewhere deselects
      else {
        setSelectedSquare(null)
        setValidMoves([])
      }
    }
    // No piece selected yet
    else if (piece && piece.player === currentPlayer) {
      // If must jump is active, can only select pieces that can jump
      if (mustJump) {
        const pieceJumps = getValidMoves(board, row, col, true)
        if (pieceJumps.length > 0) {
          setSelectedSquare([row, col])
          setValidMoves(pieceJumps)
        }
      } else {
        setSelectedSquare([row, col])
        setValidMoves(getValidMoves(board, row, col, false))
      }
    }
  }

  const resetGame = () => {
    setBoard(createInitialBoard())
    setCurrentPlayer('red')
    setSelectedSquare(null)
    setValidMoves([])
    setWinner(null)
    setMustJump(null)
    setMoveHistory([])
    setIsPlaying(false)
  }

  const startGame = () => {
    resetGame()
    setIsPlaying(true)
  }

  const renderPiece = (piece) => {
    if (!piece) return null
    const isRed = piece.player === 'red'
    return (
      <div
        className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
          ${isRed ? 'bg-red-500' : 'bg-gray-900'}
          ${piece.isKing ? 'ring-4 ring-yellow-400' : ''}
          shadow-md
        `}
      >
        {piece.isKing && (
          <span className={`text-lg sm:text-xl font-bold ${isRed ? 'text-yellow-300' : 'text-yellow-400'}`}>
            K
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-2 sm:p-4 lg:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-2 sm:mb-4">
        ← Back
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Checkers</h1>

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4 mt-4 sm:mt-8">
          <p className="text-gray-400 mb-2">Red moves first!</p>
          <button
            onClick={startGame}
            className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${currentPlayer === 'red' ? 'bg-red-500' : 'bg-gray-900 border-2 border-gray-600'}`} />
            <span className="text-sm sm:text-base font-semibold">
              {winner ? `${winner} wins!` : `${currentPlayer}'s turn${mustJump ? ' (Must jump!)' : ''}`}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div
              className="grid border-4 border-amber-800 rounded-lg overflow-hidden shadow-xl"
              style={{
                gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                width: 'min(90vw, 400px)'
              }}
            >
              {board.flatMap((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isSelected = selectedSquare?.[0] === rowIndex && selectedSquare?.[1] === colIndex
                  const isValidMove = validMoves.some(m => m.row === rowIndex && m.col === colIndex)
                  const isLightSquare = (rowIndex + colIndex) % 2 === 0

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      className={`
                        flex items-center justify-center cursor-pointer
                        transition-colors select-none aspect-square
                        ${isLightSquare ? 'bg-amber-200' : 'bg-amber-800'}
                        ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                        ${isValidMove ? 'bg-green-500 bg-opacity-60' : ''}
                      `}
                    >
                      {renderPiece(piece)}
                    </div>
                  )
                })
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 w-52">
              <h3 className="font-bold mb-2 text-sm sm:text-base">Move History</h3>
              <div className="text-xs sm:text-sm space-y-1 max-h-48 sm:max-h-64 overflow-y-auto">
                {moveHistory.length === 0 && <p className="text-gray-500">No moves yet</p>}
                {moveHistory.map((move, i) => (
                  <div key={i} className="text-gray-300">
                    <span className="text-gray-500">{Math.floor(i / 2) + 1}. </span>{move}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-500 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
            >
              Reset
            </button>
            <button
              onClick={resetGame}
              className="bg-gray-600 hover:bg-gray-500 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
            >
              Menu
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Checkers
