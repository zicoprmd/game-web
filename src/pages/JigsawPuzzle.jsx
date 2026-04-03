import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const GRID_SIZE = 3
const TOTAL_PIECES = GRID_SIZE * GRID_SIZE

const SAMPLE_IMAGES = [
  { name: 'Mountain', url: 'https://picsum.photos/id/10/600/400', cols: 3, rows: 3 },
  { name: 'Ocean', url: 'https://picsum.photos/id/14/600/400', cols: 3, rows: 3 },
  { name: 'Forest', url: 'https://picsum.photos/id/15/600/400', cols: 3, rows: 3 },
  { name: 'Sunset', url: 'https://picsum.photos/id/22/600/400', cols: 3, rows: 3 },
  { name: 'City', url: 'https://picsum.photos/id/26/600/400', cols: 3, rows: 3 }
]

function createPieces(imageUrl) {
  const pieces = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      pieces.push({
        id: r * GRID_SIZE + c,
        correctRow: r,
        correctCol: c,
        currentRow: null,
        currentCol: null
      })
    }
  }
  return pieces
}

function shuffleArray(arr) {
  const newArr = [...arr]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

function JigsawPuzzle() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [pieces, setPieces] = useState([])
  const [placedPieces, setPlacedPieces] = useState(Array(TOTAL_PIECES).fill(null))
  const [holdingPiece, setHoldingPiece] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [bestTime, setBestTime] = useState(() => {
    const saved = localStorage.getItem('jigsaw_best_time')
    return saved ? parseInt(saved) : 0
  })
  const [bestMoves, setBestMoves] = useState(() => {
    const saved = localStorage.getItem('jigsaw_best_moves')
    return saved ? parseInt(saved) : 0
  })
  const [showPreview, setShowPreview] = useState(false)
  const timerRef = useRef(null)
  const canvasRef = useRef(null)

  const pieceWidth = 600 / GRID_SIZE
  const pieceHeight = 400 / GRID_SIZE

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startGame = useCallback((image) => {
    if (timerRef.current) clearInterval(timerRef.current)

    setSelectedImage(image)
    setPieces(shuffleArray(createPieces(image.url)))
    setPlacedPieces(Array(TOTAL_PIECES).fill(null))
    setHoldingPiece(null)
    setGameStarted(true)
    setGameComplete(false)
    setMoves(0)
    setTime(0)
    setShowPreview(false)

    timerRef.current = setInterval(() => {
      setTime(t => t + 1)
    }, 1000)
  }, [])

  const handleDragStart = (e, piece) => {
    setHoldingPiece(piece)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    if (!holdingPiece) return

    const targetPiece = placedPieces[targetIndex]

    if (targetPiece === null) {
      // Place piece in empty slot
      const newPlaced = [...placedPieces]
      newPlaced[targetIndex] = holdingPiece
      setPlacedPieces(newPlaced)
      setMoves(m => m + 1)

      // Check if this piece is in correct position
      if (holdingPiece.correctRow * GRID_SIZE + holdingPiece.correctCol === targetIndex) {
        // Correct position - piece stays
      } else {
        // Wrong position - piece goes to available slots or back to tray
      }
    } else if (targetPiece.id !== holdingPiece.id) {
      // Swap pieces
      const newPlaced = [...placedPieces]
      const holdingIndex = newPlaced.findIndex(p => p && p.id === holdingPiece.id)
      newPlaced[holdingIndex] = targetPiece
      newPlaced[targetIndex] = holdingPiece
      setPlacedPieces(newPlaced)
      setMoves(m => m + 1)
    }

    setHoldingPiece(null)
  }

  const removeFromPlaced = useCallback((index) => {
    const newPlaced = [...placedPieces]
    newPlaced[index] = null
    setPlacedPieces(newPlaced)
  }, [placedPieces])

  // Check for game completion
  useEffect(() => {
    if (!gameStarted || placedPieces.includes(null)) return

    const isComplete = placedPieces.every((piece, index) => {
      return piece && piece.correctRow * GRID_SIZE + piece.correctCol === index
    })

    if (isComplete && placedPieces.length === TOTAL_PIECES) {
      setGameComplete(true)
      if (timerRef.current) clearInterval(timerRef.current)

      // Save best time/moves
      if (bestTime === 0 || time < bestTime) {
        setBestTime(time)
        localStorage.setItem('jigsaw_best_time', time.toString())
      }
      if (bestMoves === 0 || moves < bestMoves) {
        setBestMoves(moves)
        localStorage.setItem('jigsaw_best_moves', moves.toString())
      }
    }
  }, [placedPieces, gameStarted, time, moves, bestTime, bestMoves])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAvailablePieces = () => {
    const placedIds = placedPieces.filter(p => p !== null).map(p => p.id)
    return pieces.filter(p => !placedIds.includes(p.id))
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 flex flex-col items-center">
        <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-8">Jigsaw Puzzle</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
          {SAMPLE_IMAGES.map((img, idx) => (
            <button
              key={idx}
              onClick={() => startGame(img)}
              className="bg-gray-800 rounded-xl overflow-hidden hover:scale-105 transition-transform border-2 border-gray-700 hover:border-purple-500"
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4 text-center">
                <p className="font-semibold">{img.name}</p>
                <p className="text-gray-400 text-sm">{GRID_SIZE}x{GRID_SIZE} pieces</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Jigsaw Puzzle</h1>
      {selectedImage && (
        <p className="text-gray-400 mb-4">{selectedImage.name}</p>
      )}

      {/* Stats */}
      <div className="flex gap-6 mb-4">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Time</p>
          <p className="text-2xl font-bold text-blue-400">{formatTime(time)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Moves</p>
          <p className="text-2xl font-bold text-green-400">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Placed</p>
          <p className="text-2xl font-bold text-yellow-400">
            {placedPieces.filter(p => p !== null).length}/{TOTAL_PIECES}
          </p>
        </div>
      </div>

      {/* Preview Toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="mb-4 text-sm text-purple-400 hover:text-purple-300 underline"
      >
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </button>

      {/* Preview Image */}
      {showPreview && selectedImage && (
        <div className="mb-4 rounded-lg overflow-hidden border-2 border-purple-500">
          <img
            src={selectedImage.url}
            alt="Preview"
            className="w-auto h-auto max-w-md"
          />
        </div>
      )}

      {/* Puzzle Grid */}
      <div
        className="relative bg-gray-800 rounded-lg overflow-hidden border-4 border-gray-600 mb-6"
        style={{
          width: pieceWidth * GRID_SIZE,
          height: pieceHeight * GRID_SIZE
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: GRID_SIZE - 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute bg-gray-700 left-0 right-0"
              style={{ top: `${((i + 1) / GRID_SIZE) * 100}%`, height: 2 }}
            />
          ))}
          {Array.from({ length: GRID_SIZE - 1 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute bg-gray-700 top-0 bottom-0"
              style={{ left: `${((i + 1) / GRID_SIZE) * 100}%`, width: 2 }}
            />
          ))}
        </div>

        {/* Placed pieces */}
        {placedPieces.map((piece, index) => (
          <div
            key={`slot-${index}`}
            className="absolute"
            style={{
              width: pieceWidth,
              height: pieceHeight,
              left: (index % GRID_SIZE) * pieceWidth,
              top: Math.floor(index / GRID_SIZE) * pieceHeight
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            {piece && (
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, piece)}
                onClick={() => removeFromPlaced(index)}
                className="w-full h-full cursor-pointer relative overflow-hidden"
                style={{
                  backgroundImage: `url(${selectedImage.url})`,
                  backgroundSize: `${pieceWidth * GRID_SIZE}px ${pieceHeight * GRID_SIZE}px`,
                  backgroundPosition: `-${piece.correctCol * pieceWidth}px -${piece.correctRow * pieceHeight}px`
                }}
              >
                {/* Piece border effect */}
                <div
                  className="absolute inset-0 border border-white/20 pointer-events-none"
                  style={{ borderWidth: 1 }}
                />
                {piece.correctRow * GRID_SIZE + piece.correctCol === index && (
                  <div className="absolute inset-0 bg-green-500/20 pointer-events-none" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Available Pieces Tray */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm mb-2 text-center">Drag pieces to the board:</p>
        <div
          className="flex flex-wrap gap-2 p-4 bg-gray-800 rounded-lg max-w-xl justify-center"
          style={{ minHeight: pieceHeight + 20 }}
        >
          {getAvailablePieces().map((piece) => (
            <div
              key={`tray-${piece.id}`}
              draggable
              onDragStart={(e) => handleDragStart(e, piece)}
              className="cursor-grab active:cursor-grabbing rounded overflow-hidden border-2 border-gray-600 hover:border-purple-400 transition-colors"
              style={{
                width: pieceWidth / 1.5,
                height: pieceHeight / 1.5,
                backgroundImage: `url(${selectedImage.url})`,
                backgroundSize: `${(pieceWidth / 1.5) * GRID_SIZE}px ${(pieceHeight / 1.5) * GRID_SIZE}px`,
                backgroundPosition: `-${piece.correctCol * (pieceWidth / 1.5)}px -${piece.correctRow * (pieceHeight / 1.5)}px`
              }}
            />
          ))}
        </div>
      </div>

      {/* Game Complete Modal */}
      {gameComplete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 text-center border-2 border-yellow-500">
            <p className="text-4xl font-bold mb-4 text-yellow-400"> Puzzle Complete! </p>
            <p className="text-2xl mb-2">Time: {formatTime(time)}</p>
            <p className="text-2xl mb-6">Moves: {moves}</p>
            {time <= bestTime && moves <= bestMoves && (
              <p className="text-green-400 mb-4">New Best Record!</p>
            )}
            <button
              onClick={() => startGame(selectedImage)}
              className="bg-purple-600 hover:bg-purple-500 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Best Scores */}
      <div className="flex gap-8 text-sm text-gray-400">
        <div>Best Time: <span className="text-white">{bestTime > 0 ? formatTime(bestTime) : '--'}</span></div>
        <div>Best Moves: <span className="text-white">{bestMoves > 0 ? bestMoves : '--'}</span></div>
      </div>
    </div>
  )
}

export default JigsawPuzzle
