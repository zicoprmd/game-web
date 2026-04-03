import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

const COLORS = [
  { id: 0, name: 'green', base: 'bg-green-600', light: 'bg-green-400', active: 'bg-green-300', sound: 329.63 },
  { id: 1, name: 'red', base: 'bg-red-600', light: 'bg-red-400', active: 'bg-red-300', sound: 261.63 },
  { id: 2, name: 'yellow', base: 'bg-yellow-500', light: 'bg-yellow-300', active: 'bg-yellow-200', sound: 392.00 },
  { id: 3, name: 'blue', base: 'bg-blue-600', light: 'bg-blue-400', active: 'bg-blue-300', sound: 493.88 }
]

function SimonSays() {
  const [sequence, setSequence] = useState([])
  const [playerIndex, setPlayerIndex] = useState(0)
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [activeColor, setActiveColor] = useState(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('simonHighScore')
    return saved ? parseInt(saved) : 0
  })
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const playSound = useCallback((freq) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.frequency.value = freq
      oscillator.type = 'square'
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)

      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.3)
    } catch (e) {
      // Audio not supported
    }
  }, [])

  const playColor = useCallback((colorIndex, duration = 400) => {
    return new Promise(resolve => {
      setActiveColor(colorIndex)
      playSound(COLORS[colorIndex].sound)

      setTimeout(() => {
        setActiveColor(null)
        setTimeout(resolve, 100)
      }, duration)
    })
  }, [playSound])

  const showSequence = useCallback(async (seq) => {
    setIsShowingSequence(true)
    setIsPlaying(true)

    await new Promise(r => setTimeout(r, 500))

    for (const colorIndex of seq) {
      await playColor(colorIndex)
    }

    setIsShowingSequence(false)
  }, [playColor])

  const addToSequence = useCallback(() => {
    const newColor = Math.floor(Math.random() * 4)
    const newSequence = [...sequence, newColor]
    setSequence(newSequence)
    showSequence(newSequence)
  }, [sequence, showSequence])

  const startGame = useCallback(() => {
    setSequence([])
    setPlayerIndex(0)
    setScore(0)
    setGameOver(false)
    setTimeout(() => addToSequence(), 500)
  }, [addToSequence])

  const handleColorClick = useCallback((colorIndex) => {
    if (isShowingSequence || gameOver || !isPlaying) return

    playColor(colorIndex, 200)

    if (colorIndex === sequence[playerIndex]) {
      const nextIndex = playerIndex + 1

      if (nextIndex === sequence.length) {
        const newScore = score + 1
        setScore(newScore)
        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('simonHighScore', newScore.toString())
        }
        setPlayerIndex(0)
        setTimeout(() => addToSequence(), 800)
      } else {
        setPlayerIndex(nextIndex)
      }
    } else {
      setGameOver(true)
      playSound(150)
    }
  }, [isShowingSequence, gameOver, isPlaying, sequence, playerIndex, score, highScore, playColor, playSound, addToSequence])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Simon Says</h1>

      <div className="flex gap-8 mb-4">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Score</p>
          <p className="text-2xl font-bold">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">High Score</p>
          <p className="text-2xl font-bold">{highScore}</p>
        </div>
      </div>

      {!isPlaying || gameOver ? (
        <div className="flex flex-col items-center gap-4 mt-8">
          {gameOver && (
            <p className="text-red-400 text-xl mb-2">
              Game Over! Final Score: {score}
            </p>
          )}
          <p className="text-gray-400 mb-2">Watch the pattern, then repeat it!</p>
          <button
            onClick={startGame}
            className="bg-purple-600 hover:bg-purple-500 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            {gameOver ? 'Play Again' : 'Start Game'}
          </button>
        </div>
      ) : (
        <div className="relative">
          {isShowingSequence && (
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold">
              Watch...
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-700 rounded-2xl">
            {COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => handleColorClick(color.id)}
                disabled={isShowingSequence || gameOver}
                className={`
                  w-32 h-32 rounded-xl transition-all duration-100
                  ${activeColor === color.id ? color.active : color.base}
                  ${isShowingSequence ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}
                  shadow-lg
                `}
              />
            ))}
          </div>

          {isShowingSequence && (
            <p className="text-center text-gray-400 mt-6">Watch and remember!</p>
          )}

          <div className="flex gap-4 mt-8 justify-center">
            <button
              onClick={() => { setIsPlaying(false); setGameOver(false); setSequence([]) }}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SimonSays
