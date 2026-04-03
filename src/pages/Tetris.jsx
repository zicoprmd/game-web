import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const COLS = 10
const ROWS = 20
const CELL_SIZE = 24

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-500' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' }
}

const TETRO_KEYS = Object.keys(TETROMINOES)

function createEmptyBoard() {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
}

function Tetris() {
  const [board, setBoard] = useState(createEmptyBoard)
  const [currentPiece, setCurrentPiece] = useState(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('tetrisHighScore')
    return saved ? parseInt(saved) : 0
  })
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const boardRef = useRef(board)
  const currentPieceRef = useRef(currentPiece)
  const positionRef = useRef(position)
  const isPlayingRef = useRef(isPlaying)
  const isPausedRef = useRef(isPaused)
  const gameLoopRef = useRef(null)

  useEffect(() => { boardRef.current = board }, [board])
  useEffect(() => { currentPieceRef.current = currentPiece }, [currentPiece])
  useEffect(() => { positionRef.current = position }, [position])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  const getRandomTetromino = useCallback(() => {
    const key = TETRO_KEYS[Math.floor(Math.random() * TETRO_KEYS.length)]
    return { ...TETROMINOES[key], type: key }
  }, [])

  const isValidPosition = useCallback((piece, pos, boardState) => {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const newX = pos.x + c
          const newY = pos.y + r
          if (newX < 0 || newX >= COLS || newY >= ROWS) return false
          if (newY >= 0 && boardState[newY][newX]) return false
        }
      }
    }
    return true
  }, [])

  const rotatePiece = useCallback((piece) => {
    const rows = piece.shape.length
    const cols = piece.shape[0].length
    const rotated = []
    for (let c = 0; c < cols; c++) {
      const newRow = []
      for (let r = rows - 1; r >= 0; r--) {
        newRow.push(piece.shape[r][c])
      }
      rotated.push(newRow)
    }
    return { ...piece, shape: rotated }
  }, [])

  const lockPiece = useCallback(() => {
    const piece = currentPieceRef.current
    const pos = positionRef.current
    const newBoard = boardRef.current.map(r => [...r])

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const y = pos.y + r
          const x = pos.x + c
          if (y >= 0) {
            newBoard[y][x] = piece.color
          }
        }
      }
    }

    let linesCleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r].every(cell => cell !== null)) {
        newBoard.splice(r, 1)
        newBoard.unshift(Array(COLS).fill(null))
        linesCleared++
        r++
      }
    }

    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800][linesCleared] * level
      const newScore = score + points
      const newLines = lines + linesCleared
      const newLevel = Math.floor(newLines / 10) + 1

      setScore(newScore)
      setLines(newLines)
      setLevel(newLevel)

      if (newScore > highScore) {
        setHighScore(newScore)
        localStorage.setItem('tetrisHighScore', newScore.toString())
      }
    }

    setBoard(newBoard)
    boardRef.current = newBoard

    const newPiece = getRandomTetromino()
    const startPos = { x: Math.floor((COLS - newPiece.shape[0].length) / 2), y: 0 }

    if (!isValidPosition(newPiece, startPos, boardRef.current)) {
      setIsGameOver(true)
      setIsPlaying(false)
      return
    }

    setCurrentPiece(newPiece)
    currentPieceRef.current = newPiece
    setPosition(startPos)
    positionRef.current = startPos
  }, [getRandomTetromino, isValidPosition, score, lines, level, highScore])

  const moveDown = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current || isGameOver) return

    const piece = currentPieceRef.current
    const pos = positionRef.current
    const newPos = { x: pos.x, y: pos.y + 1 }

    if (isValidPosition(piece, newPos, boardRef.current)) {
      setPosition(newPos)
      positionRef.current = newPos
    } else {
      lockPiece()
    }
  }, [isValidPosition, lockPiece])

  const moveLeft = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current || isGameOver) return

    const piece = currentPieceRef.current
    const pos = positionRef.current
    const newPos = { x: pos.x - 1, y: pos.y }

    if (isValidPosition(piece, newPos, boardRef.current)) {
      setPosition(newPos)
      positionRef.current = newPos
    }
  }, [isValidPosition])

  const moveRight = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current || isGameOver) return

    const piece = currentPieceRef.current
    const pos = positionRef.current
    const newPos = { x: pos.x + 1, y: pos.y }

    if (isValidPosition(piece, newPos, boardRef.current)) {
      setPosition(newPos)
      positionRef.current = newPos
    }
  }, [isValidPosition])

  const rotate = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current || isGameOver) return

    const piece = currentPieceRef.current
    const rotated = rotatePiece(piece)

    if (isValidPosition(rotated, positionRef.current, boardRef.current)) {
      setCurrentPiece(rotated)
      currentPieceRef.current = rotated
    }
  }, [isValidPosition, rotatePiece])

  const hardDrop = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current || isGameOver) return

    const piece = currentPieceRef.current
    const pos = positionRef.current
    let newY = pos.y

    while (isValidPosition(piece, { x: pos.x, y: newY + 1 }, boardRef.current)) {
      newY++
    }

    setPosition({ x: pos.x, y: newY })
    positionRef.current = { x: pos.x, y: newY }

    setTimeout(() => lockPiece(), 50)
  }, [isValidPosition, lockPiece])

  const handleKeyDown = useCallback((e) => {
    if (!isPlayingRef.current) return

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault()
        moveLeft()
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault()
        moveRight()
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        moveDown()
        break
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        rotate()
        break
      case ' ':
        e.preventDefault()
        hardDrop()
        break
      case 'p':
      case 'P':
        e.preventDefault()
        setIsPaused(prev => !prev)
        break
    }
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return

    const speed = Math.max(100, 1000 - (level - 1) * 100)
    const interval = setInterval(moveDown, speed)
    return () => clearInterval(interval)
  }, [isPlaying, isPaused, isGameOver, level, moveDown])

  const startGame = () => {
    const newBoard = createEmptyBoard()
    setBoard(newBoard)
    boardRef.current = newBoard

    const newPiece = getRandomTetromino()
    const startPos = { x: Math.floor((COLS - newPiece.shape[0].length) / 2), y: 0 }

    setCurrentPiece(newPiece)
    currentPieceRef.current = newPiece
    setPosition(startPos)
    positionRef.current = startPos

    setScore(0)
    setLines(0)
    setLevel(1)
    setIsPlaying(true)
    setIsGameOver(false)
    setIsPaused(false)
  }

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])

    if (currentPiece && isPlaying && !isPaused) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const y = position.y + r
            const x = position.x + c
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
              displayBoard[y][x] = currentPiece.color
            }
          }
        }
      }
    }

    return displayBoard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-2 sm:p-4 lg:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-2 sm:mb-4">
        ← Back
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Tetris</h1>

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4 mt-4 sm:mt-8">
          {isGameOver && (
            <p className="text-red-400 text-xl mb-2">Game Over!</p>
          )}
          <div className="text-center mb-4">
            <p className="text-gray-400 mb-1">High Score: {highScore}</p>
            <p className="text-gray-400 text-sm">Controls: ← → ↓ ↑ SPACE P</p>
          </div>
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            {isGameOver ? 'Play Again' : 'Start Game'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 sm:gap-4 mb-4 text-sm sm:text-base">
            <span>Score: <strong>{score}</strong></span>
            <span>Lines: <strong>{lines}</strong></span>
            <span>Level: <strong>{level}</strong></span>
          </div>

          {isPaused && (
            <div className="absolute z-10 bg-black/70 px-8 py-4 rounded-lg">
              <p className="text-2xl font-bold">Paused</p>
              <p className="text-gray-400 text-sm mt-2">Press P to resume</p>
            </div>
          )}

          <div
            className="relative border-4 border-gray-600 bg-gray-900 touch-none select-none"
            style={{
              width: COLS * CELL_SIZE,
              height: ROWS * CELL_SIZE
            }}
          >
            {renderBoard().map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`absolute ${cell || 'bg-gray-800'}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    left: colIndex * CELL_SIZE,
                    top: rowIndex * CELL_SIZE
                  }}
                />
              ))
            )}
          </div>

          {/* Touch controls for mobile */}
          <div className="flex flex-col items-center mt-4 gap-2">
            <button
              onTouchStart={rotate}
              className="bg-purple-600 active:bg-purple-700 w-14 h-14 rounded-lg text-xl font-bold flex items-center justify-center"
            >
              ↻
            </button>
            <div className="flex gap-2">
              <button
                onTouchStart={moveLeft}
                className="bg-blue-600 active:bg-blue-700 w-14 h-14 rounded-lg text-2xl font-bold flex items-center justify-center"
              >
                ←
              </button>
              <button
                onTouchStart={moveDown}
                className="bg-green-600 active:bg-green-700 w-14 h-14 rounded-lg text-2xl font-bold flex items-center justify-center"
              >
                ↓
              </button>
              <button
                onTouchStart={moveRight}
                className="bg-blue-600 active:bg-blue-700 w-14 h-14 rounded-lg text-2xl font-bold flex items-center justify-center"
              >
                →
              </button>
            </div>
            <button
              onTouchStart={hardDrop}
              className="bg-red-600 active:bg-red-700 w-32 h-12 rounded-lg text-lg font-bold flex items-center justify-center"
            >
              DROP
            </button>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setIsPaused(prev => !prev)}
              className="bg-yellow-600 hover:bg-yellow-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Restart
            </button>
            <button
              onClick={() => setIsPlaying(false)}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Menu
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Tetris
