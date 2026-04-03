import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
}

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }

const INITIAL_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
]

function Chess() {
  const [board, setBoard] = useState(INITIAL_BOARD.map(r => [...r]))
  const [currentPlayer, setCurrentPlayer] = useState('white')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [winner, setWinner] = useState(null)
  const [isCheck, setIsCheck] = useState(false)
  const [moveHistory, setMoveHistory] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVsComputer, setIsVsComputer] = useState(false)
  const [isComputerThinking, setIsComputerThinking] = useState(false)
  const [promotionSquare, setPromotionSquare] = useState(null)
  const [castlingRights, setCastlingRights] = useState({
    whiteKingside: true, whiteQueenside: true,
    blackKingside: true, blackQueenside: true
  })
  const [enPassantTarget, setEnPassantTarget] = useState(null)

  const boardRef = useRef(board)

  useEffect(() => { boardRef.current = board }, [board])

  const cloneBoard = (b) => b.map(r => [...r])

  const getPlayer = (piece) => {
    if (!piece) return null
    return piece === piece.toUpperCase() ? 'white' : 'black'
  }

  const isValidPos = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8

  const findKing = useCallback((b, player) => {
    const king = player === 'white' ? 'K' : 'k'
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (b[r][c] === king) return { row: r, col: c }
    return null
  }, [])

  const isAttacked = useCallback((b, row, col, byPlayer) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = b[r][c]
        if (!piece || getPlayer(piece) !== byPlayer) continue

        const type = piece.toLowerCase()
        const pr = r, pc = c

        const addMove = (mr, mc) => {
          if (mr === row && mc === col) return true
          if (!isValidPos(mr, mc)) return false
          return !b[mr][mc]
        }

        const addSliding = (dirs) => {
          for (const [dr, dc] of dirs) {
            for (let i = 1; i < 8; i++) {
              const nr = pr + dr * i, nc = pc + dc * i
              if (nr === row && nc === col) return true
              if (!isValidPos(nr, nc) || b[nr][nc]) break
            }
          }
          return false
        }

        switch (type) {
          case 'p': {
            const dir = byPlayer === 'white' ? -1 : 1
            if (pr + dir === row && (pc - 1 === col || pc + 1 === col)) return true
            break
          }
          case 'n':
            for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]])
              if (pr + dr === row && pc + dc === col) return true
            break
          case 'b':
            if (addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1]])) return true
            break
          case 'r':
            if (addSliding([[-1, 0], [1, 0], [0, -1], [0, 1]])) return true
            break
          case 'q':
            if (addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]])) return true
            break
          case 'k':
            for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]])
              if (pr + dr === row && pc + dc === col) return true
            break
        }
      }
    }
    return false
  }, [])

  const isInCheck = useCallback((b, player) => {
    const king = findKing(b, player)
    if (!king) return false
    return isAttacked(b, king.row, king.col, player === 'white' ? 'black' : 'white')
  }, [findKing, isAttacked])

  const getRawMoves = (b, row, col, piece, epTarget) => {
    const moves = []
    const type = piece.toLowerCase()
    const player = getPlayer(piece)
    const dir = player === 'white' ? -1 : 1

    const addMove = (r, c) => {
      if (!isValidPos(r, c)) return false
      if (b[r][c] && getPlayer(b[r][c]) === player) return false
      moves.push({ row: r, col: c })
      return !b[r][c]
    }

    const addSliding = (dirs) => {
      for (const [dr, dc] of dirs) {
        for (let i = 1; i < 8; i++) {
          const nr = row + dr * i, nc = col + dc * i
          if (!addMove(nr, nc)) break
          if (b[nr]?.[nc]) break
        }
      }
    }

    switch (type) {
      case 'p':
        if (addMove(row + dir, col)) {
          if ((player === 'white' && row === 6) || (player === 'black' && row === 1))
            addMove(row + 2 * dir, col)
        }
        for (const dc of [-1, 1]) {
          const nr = row + dir, nc = col + dc
          if (isValidPos(nr, nc)) {
            if (b[nr][nc] && getPlayer(b[nr][nc]) !== player)
              moves.push({ row: nr, col: nc })
            if (epTarget && epTarget.row === nr && epTarget.col === nc)
              moves.push({ row: nr, col: nc, enPassant: true })
          }
        }
        break
      case 'n':
        for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]])
          addMove(row + dr, col + dc)
        break
      case 'b':
        addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1]])
        break
      case 'r':
        addSliding([[-1, 0], [1, 0], [0, -1], [0, 1]])
        break
      case 'q':
        addSliding([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]])
        break
      case 'k':
        for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]])
          addMove(row + dr, col + dc)
        break
    }

    return moves
  }

  const getValidMoves = useCallback((b, row, col, epTarget, castRights, checkForCheck = true) => {
    const piece = b[row][col]
    if (!piece) return []

    const player = getPlayer(piece)
    const raw = getRawMoves(b, row, col, piece, epTarget)

    if (!checkForCheck) return raw

    const valid = []
    for (const move of raw) {
      const nb = cloneBoard(b)
      nb[move.row][move.col] = piece
      nb[row][col] = null

      if (move.enPassant) {
        nb[row][move.col] = null
      }

      if (piece.toLowerCase() === 'k') {
        if (move.col - col === 2) {
          nb[move.row][5] = nb[move.row][7]
          nb[move.row][7] = null
        }
        if (col - move.col === 2) {
          nb[move.row][3] = nb[move.row][0]
          nb[move.row][0] = null
        }
      }

      if (!isInCheck(nb, player)) valid.push(move)
    }

    return valid
  }, [isInCheck])

  const hasAnyMove = useCallback((b, player, epTarget, castRights) => {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (b[r][c] && getPlayer(b[r][c]) === player)
          if (getValidMoves(b, r, c, epTarget, castRights).length > 0) return true
    return false
  }, [getValidMoves])

  const evaluateBoard = useCallback((b) => {
    let score = 0
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const piece = b[r][c]
        if (!piece) continue
        const val = PIECE_VALUES[piece.toLowerCase()]
        score += getPlayer(piece) === 'white' ? val : -val
      }
    return score
  }, [])

  const minimax = useCallback((b, depth, alpha, beta, isMaximizing, epTarget, castRights) => {
    const player = isMaximizing ? 'white' : 'black'

    if (depth === 0) return { score: evaluateBoard(b), move: null }

    const moves = []
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (b[r][c] && getPlayer(b[r][c]) === player) {
          const valid = getValidMoves(b, r, c, epTarget, castRights, true)
          for (const m of valid)
            moves.push({ from: { row: r, col: c }, to: m, piece: b[r][c] })
        }

    if (moves.length === 0)
      return { score: isInCheck(b, player) ? (isMaximizing ? -1000 : 1000) : 0, move: null }

    let bestMove = null

    if (isMaximizing) {
      let best = -Infinity
      for (const m of moves) {
        const nb = cloneBoard(b)
        nb[m.to.row][m.to.col] = m.piece
        nb[m.from.row][m.from.col] = null

        let newEPRef = null, newCastRef = { ...castRights }
        const piece = m.piece.toLowerCase()

        if (piece === 'p' && (m.to.row === 0 || m.to.row === 7)) {
          nb[m.to.row][m.to.col] = 'Q'
        }
        if (piece === 'p' && Math.abs(m.from.row - m.to.row) === 2)
          newEPRef = { row: (m.from.row + m.to.row) / 2, col: m.to.col }
        if (piece === 'k') {
          newCastRef.whiteKingside = false
          newCastRef.whiteQueenside = false
        }
        if (piece === 'r' && m.from.row === 7 && m.from.col === 7) newCastRef.whiteKingside = false
        if (piece === 'r' && m.from.row === 7 && m.from.col === 0) newCastRef.whiteQueenside = false

        const result = minimax(nb, depth - 1, alpha, beta, false, newEPRef, newCastRef)
        if (result.score > best) {
          best = result.score
          bestMove = m
        }
        alpha = Math.max(alpha, best)
        if (beta <= alpha) break
      }
      return { score: best, move: bestMove }
    } else {
      let best = Infinity
      for (const m of moves) {
        const nb = cloneBoard(b)
        nb[m.to.row][m.to.col] = m.piece
        nb[m.from.row][m.from.col] = null

        let newEPRef = null, newCastRef = { ...castRights }
        const piece = m.piece.toLowerCase()

        if (piece === 'p' && (m.to.row === 0 || m.to.row === 7)) {
          nb[m.to.row][m.to.col] = 'q'
        }
        if (piece === 'p' && Math.abs(m.from.row - m.to.row) === 2)
          newEPRef = { row: (m.from.row + m.to.row) / 2, col: m.to.col }
        if (piece === 'k') {
          newCastRef.blackKingside = false
          newCastRef.blackQueenside = false
        }
        if (piece === 'r' && m.from.row === 0 && m.from.col === 7) newCastRef.blackKingside = false
        if (piece === 'r' && m.from.row === 0 && m.from.col === 0) newCastRef.blackQueenside = false

        const result = minimax(nb, depth - 1, alpha, beta, true, newEPRef, newCastRef)
        if (result.score < best) {
          best = result.score
          bestMove = m
        }
        beta = Math.min(beta, best)
        if (beta <= alpha) break
      }
      return { score: best, move: bestMove }
    }
  }, [evaluateBoard, getValidMoves, isInCheck])

  const makeAIMove = useCallback(() => {
    const result = minimax(boardRef.current, 3, -Infinity, Infinity, false, enPassantTarget, castlingRights)
    if (!result.move) return

    const { from, to, piece } = result.move
    let nb = cloneBoard(boardRef.current)
    nb[to.row][to.col] = piece
    nb[from.row][from.col] = null

    let newEPRef = null
    const newCastRef = { ...castlingRights }
    const type = piece.toLowerCase()

    if (type === 'p' && (to.row === 0 || to.row === 7)) {
      nb[to.row][to.col] = 'q'
    }

    if (type === 'p' && Math.abs(from.row - to.row) === 2)
      newEPRef = { row: (from.row + to.row) / 2, col: to.col }

    if (to.row === from.row && Math.abs(to.col - from.col) === 2) {
      if (piece === 'K' && to.col === 6) {
        nb[from.row][5] = nb[from.row][7]
        nb[from.row][7] = null
      }
      if (piece === 'K' && to.col === 2) {
        nb[from.row][3] = nb[from.row][0]
        nb[from.row][0] = null
      }
    }

    if (type === 'k') { newCastRef.whiteKingside = false; newCastRef.whiteQueenside = false }
    if (type === 'r') {
      if (from.row === 7 && from.col === 7) newCastRef.whiteKingside = false
      if (from.row === 7 && from.col === 0) newCastRef.whiteQueenside = false
      if (from.row === 0 && from.col === 7) newCastRef.blackKingside = false
      if (from.row === 0 && from.col === 0) newCastRef.blackQueenside = false
    }

    // Update move history for AI move
    const fromNotation = `${String.fromCharCode(97 + from.col)}${8 - from.row}`
    const toNotation = `${String.fromCharCode(97 + to.col)}${8 - to.row}`
    const captured = boardRef.current[to.row][to.col] ? 'x' : ''
    let moveNotation = PIECES[piece] + fromNotation + captured + toNotation

    if (type === 'p' && (to.row === 0 || to.row === 7)) {
      moveNotation += '=Q'
    }

    setMoveHistory(prev => [...prev, moveNotation])

    setBoard(nb)
    setEnPassantTarget(newEPRef)
    setCastlingRights(newCastRef)

    const nextPlayer = 'white'
    if (!hasAnyMove(nb, nextPlayer, newEPRef, newCastRef)) {
      if (isInCheck(nb, nextPlayer)) setWinner('black')
      else setWinner('draw')
    } else {
      setCurrentPlayer(nextPlayer)
      if (isInCheck(nb, nextPlayer)) setIsCheck(true)
      else setIsCheck(false)
    }

    setIsComputerThinking(false)
  }, [minimax, enPassantTarget, castlingRights, isInCheck, hasAnyMove])

  useEffect(() => {
    if (!isPlaying || winner || !isVsComputer || currentPlayer !== 'black' || promotionSquare) return
    setIsComputerThinking(true)
    const timer = setTimeout(makeAIMove, 500)
    return () => clearTimeout(timer)
  }, [currentPlayer, isPlaying, winner, isVsComputer, promotionSquare, makeAIMove])

  const handleSquareClick = (row, col) => {
    if (winner || !isPlaying || isComputerThinking) return
    if (promotionSquare) return

    const piece = board[row][col]
    const player = getPlayer(piece)

    if (selectedSquare) {
      const [fromRow, fromCol] = selectedSquare
      const movingPiece = board[fromRow][fromCol]

      if (validMoves.some(m => m.row === row && m.col === col)) {
        let nb = cloneBoard(board)
        nb[row][col] = movingPiece
        nb[fromRow][fromCol] = null

        const type = movingPiece.toLowerCase()
        let newEPRef = null
        const newCastRef = { ...castlingRights }

        if (type === 'p' && (row === 0 || row === 7)) {
          setPromotionSquare({ row, col, piece: movingPiece, from: { row: fromRow, col: fromCol } })
          return
        }

        if (type === 'p' && Math.abs(fromRow - row) === 2)
          newEPRef = { row: (fromRow + row) / 2, col: col }

        if (type === 'p' && validMoves.find(m => m.row === row && m.col === col)?.enPassant) {
          nb[fromRow][col] = null
        }

        if (row === fromRow && Math.abs(col - fromCol) === 2 && type === 'k') {
          if (col === 6) {
            nb[fromRow][5] = nb[fromRow][7]
            nb[fromRow][7] = null
          }
          if (col === 2) {
            nb[fromRow][3] = nb[fromRow][0]
            nb[fromRow][0] = null
          }
        }

        if (type === 'k') { newCastRef.whiteKingside = false; newCastRef.whiteQueenside = false }
        if (type === 'r') {
          if (fromRow === 7 && fromCol === 7) newCastRef.whiteKingside = false
          if (fromRow === 7 && fromCol === 0) newCastRef.whiteQueenside = false
          if (fromRow === 0 && fromCol === 7) newCastRef.blackKingside = false
          if (fromRow === 0 && fromCol === 0) newCastRef.blackQueenside = false
        }

        // Update move history
        const fromNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}`
        const toNotation = `${String.fromCharCode(97 + col)}${8 - row}`
        const captured = board[row][col] ? 'x' : ''
        let moveNotation = PIECES[movingPiece] + fromNotation + captured + toNotation

        if (type === 'p' && (row === 0 || row === 7)) {
          moveNotation += '=Q'
        }

        setMoveHistory(prev => [...prev, moveNotation])

        setBoard(nb)
        setEnPassantTarget(newEPRef)
        setCastlingRights(newCastRef)
        setSelectedSquare(null)
        setValidMoves([])

        const nextPlayer = currentPlayer === 'white' ? 'black' : 'white'

        if (!hasAnyMove(nb, nextPlayer, newEPRef, newCastRef)) {
          if (isInCheck(nb, nextPlayer)) setWinner(currentPlayer)
          else setWinner('draw')
        } else {
          setCurrentPlayer(nextPlayer)
          setIsCheck(isInCheck(nb, nextPlayer))
        }
      } else if (player === currentPlayer) {
        setSelectedSquare([row, col])
        setValidMoves(getValidMoves(board, row, col, enPassantTarget, castlingRights))
      } else {
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else if (player === currentPlayer) {
      setSelectedSquare([row, col])
      setValidMoves(getValidMoves(board, row, col, enPassantTarget, castlingRights))
    }
  }

  const handlePromotion = (newPiece) => {
    if (!promotionSquare) return
    const { row, col, from } = promotionSquare
    const isWhite = promotionSquare.piece === promotionSquare.piece.toUpperCase()
    const finalPiece = isWhite ? newPiece.toUpperCase() : newPiece.toLowerCase()

    const nb = cloneBoard(board)
    nb[row][col] = finalPiece

    setBoard(nb)
    setPromotionSquare(null)
    setSelectedSquare(null)
    setValidMoves([])

    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white'

    if (!hasAnyMove(nb, nextPlayer, enPassantTarget, castlingRights)) {
      if (isInCheck(nb, nextPlayer)) setWinner(currentPlayer)
      else setWinner('draw')
    } else {
      setCurrentPlayer(nextPlayer)
      setIsCheck(isInCheck(nb, nextPlayer))
    }
  }

  const resetGame = () => {
    setBoard(INITIAL_BOARD.map(r => [...r]))
    setCurrentPlayer('white')
    setSelectedSquare(null)
    setValidMoves([])
    setWinner(null)
    setIsCheck(false)
    setMoveHistory([])
    setIsPlaying(false)
    setIsVsComputer(false)
    setIsComputerThinking(false)
    setPromotionSquare(null)
    setCastlingRights({ whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true })
    setEnPassantTarget(null)
  }

  const startGame = (vsCPU) => {
    resetGame()
    setIsVsComputer(vsCPU)
    setIsPlaying(true)
  }

  const renderPiece = (piece) => {
    if (!piece) return null
    const isWhitePiece = piece === piece.toUpperCase()
    return (
      <span className={`text-3xl sm:text-4xl ${isWhitePiece ? 'text-white' : 'text-gray-900'}`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        {PIECES[piece]}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-2 sm:p-4 lg:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-2 sm:mb-4">
        ← Back
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Chess</h1>

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4 mt-4 sm:mt-8">
          <p className="text-gray-400 mb-2">Select game mode:</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => startGame(false)}
              className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg font-semibold transition-colors"
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
          <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${currentPlayer === 'white' ? 'bg-white' : 'bg-gray-900 border-2 border-white'}`} />
            <span className={`text-sm sm:text-base font-semibold ${isCheck ? 'text-red-400' : ''}`}>
              {winner ? winner === 'draw' ? 'Draw!' : `${winner} wins!` :
               isComputerThinking ? 'Computer thinking...' :
               `${currentPlayer}'s turn${isCheck ? ' (Check!)' : ''}`}
            </span>
          </div>

          {promotionSquare && (
            <div className="mb-4 bg-gray-800 p-4 rounded-lg">
              <p className="mb-2 text-center">Choose promotion:</p>
              <div className="flex gap-2">
                {['Q', 'R', 'B', 'N'].map(p => (
                  <button
                    key={p}
                    onClick={() => handlePromotion(p)}
                    className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-lg text-3xl flex items-center justify-center"
                  >
                    {PIECES[promotionSquare.piece.toUpperCase() === promotionSquare.piece ? p.toUpperCase() : p.toLowerCase()]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative">
              <div
                className="grid border-4 border-amber-800 rounded-lg overflow-hidden shadow-xl"
                style={{
                  gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
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
                        `}
                      >
                        {renderPiece(piece)}
                        {isValidMove && !piece && (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-400 opacity-60" />
                        )}
                        {isValidMove && piece && (
                          <div className="absolute inset-1 rounded-full ring-2 ring-blue-400 opacity-60" style={{ pointerEvents: 'none' }} />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 w-52">
              <h3 className="font-bold mb-2 text-sm sm:text-base">Move History</h3>
              <div className="text-xs sm:text-sm space-y-1 max-h-48 sm:max-h-64 overflow-y-auto">
                {moveHistory.length === 0 && <p className="text-gray-500">No moves yet</p>}
                {moveHistory.map((move, i) => (
                  <div key={i} className="flex justify-between text-gray-300">
                    <span>{Math.floor(i / 2) + 1}.</span>
                    <span>{move}</span>
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
              onClick={() => resetGame()}
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

export default Chess
