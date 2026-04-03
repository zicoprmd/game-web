import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑', '🌟', '🔥', '💎', '🎯']

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createCards() {
  const selectedEmojis = EMOJIS.slice(0, 8)
  const cards = [...selectedEmojis, ...selectedEmojis].map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false
  }))
  return shuffleArray(cards)
}

function MemoryMatch() {
  const [cards, setCards] = useState([])
  const [flippedIndices, setFlippedIndices] = useState([])
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('memoryMatchHighScore')
    return saved ? parseInt(saved) : 0
  })
  const [isLocked, setIsLocked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const startGame = useCallback(() => {
    setCards(createCards())
    setFlippedIndices([])
    setMoves(0)
    setScore(0)
    setIsLocked(false)
    setIsPlaying(true)
  }, [])

  const checkMatch = useCallback((indices) => {
    const [first, second] = indices
    const isMatch = cards[first].emoji === cards[second].emoji

    if (isMatch) {
      setCards(prev => prev.map((card, idx) =>
        idx === first || idx === second ? { ...card, isMatched: true } : card
      ))
      setScore(prev => {
        const newScore = prev + 10
        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('memoryMatchHighScore', newScore.toString())
        }
        return newScore
      })
      setFlippedIndices([])
      setIsLocked(false)
    } else {
      setTimeout(() => {
        setCards(prev => prev.map((card, idx) =>
          idx === first || idx === second ? { ...card, isFlipped: false } : card
        ))
        setFlippedIndices([])
        setIsLocked(false)
      }, 800)
    }
  }, [cards, highScore])

  const handleCardClick = useCallback((index) => {
    if (isLocked) return
    if (cards[index].isFlipped || cards[index].isMatched) return
    if (flippedIndices.length === 2) return

    setCards(prev => prev.map((card, idx) =>
      idx === index ? { ...card, isFlipped: true } : card
    ))

    const newFlipped = [...flippedIndices, index]
    setFlippedIndices(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1)
      setIsLocked(true)
      setTimeout(() => checkMatch(newFlipped), 300)
    }
  }, [flippedIndices, cards, isLocked, checkMatch])

  const isGameWon = cards.length > 0 && cards.every(card => card.isMatched)

  useEffect(() => {
    if (isGameWon && isPlaying) {
      const finalScore = Math.max(score, highScore)
      setHighScore(finalScore)
      localStorage.setItem('memoryMatchHighScore', finalScore.toString())
      setTimeout(() => {
        setIsPlaying(false)
      }, 500)
    }
  }, [isGameWon, score, highScore, isPlaying])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Memory Match</h1>

      <div className="flex gap-8 mb-4">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Moves</p>
          <p className="text-2xl font-bold">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Score</p>
          <p className="text-2xl font-bold">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">High Score</p>
          <p className="text-2xl font-bold">{highScore}</p>
        </div>
      </div>

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4 mt-8">
          {isGameWon && (
            <p className="text-green-400 text-xl mb-2">
              You Won! in {moves} moves!
            </p>
          )}
          <p className="text-gray-400 mb-2">Find all matching pairs!</p>
          <button
            onClick={startGame}
            className="bg-pink-600 hover:bg-pink-500 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            {isGameWon ? 'Play Again' : 'Start Game'}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 p-4 bg-gray-700 rounded-xl">
            {cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`
                  w-16 h-20 rounded-lg flex items-center justify-center text-3xl
                  transition-all duration-300 transform
                  ${card.isFlipped || card.isMatched
                    ? 'bg-white rotate-0'
                    : 'bg-purple-600 hover:bg-purple-500 rotate-y-180'}
                  ${card.isMatched ? 'ring-2 ring-green-400' : ''}
                `}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: card.isFlipped || card.isMatched ? 'rotateY(0deg)' : 'rotateY(180deg)'
                }}
                disabled={card.isFlipped || card.isMatched}
              >
                <span
                  className={`transition-opacity duration-200 ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}`}
                >
                  {card.emoji}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setIsPlaying(false)}
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

export default MemoryMatch
