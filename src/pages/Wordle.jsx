import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

const WORDS = [
  'APPLE', 'BEACH', 'CRANE', 'DANCE', 'EAGLE', 'FLAME', 'GRAPE', 'HOUSE', 'JUICE', 'LEMON',
  'MANGO', 'NIGHT', 'OCEAN', 'PIANO', 'QUEEN', 'RIVER', 'STONE', 'TIGER', 'UNCLE', 'VOICE',
  'WATER', 'YOUTH', 'ZEBRA', 'BREAD', 'CHAIR', 'DREAM', 'EARTH', 'FROST', 'GHOST', 'HEART',
  'IMAGE', 'JOKER', 'KNIFE', 'LUNAR', 'MAGIC', 'NOBLE', 'OLIVE', 'PEARL', 'QUEST', 'ROBOT',
  'SOLAR', 'TOWER', 'URBAN', 'VIVID', 'WITCH', 'YACHT', 'ZONES', 'ADAPT', 'BLEND', 'CLOUD',
  'DRIVE', 'EXTRA', 'FEAST', 'GRASP', 'HABIT', 'INDEX', 'JOINT', 'KAYAK', 'LEAF', 'MARSH',
  'NERVE', 'ORBIT', 'PLANT', 'QUIET', 'RADAR', 'SPACE', 'TRACE', 'ULTRA', 'VAULT', 'WRIST',
  'YIELD', 'ALBUM', 'BRAVE', 'CRISP', 'DRAFT', 'EMBER', 'FLAIR', 'GLOBE', 'HUMOR', 'IVORY',
  'JEWEL', 'KARMA', 'LOTUS', 'MEDAL', 'NEXUS', 'OLIVE', 'PRISM', 'QUOTA', 'REALM', 'SWIFT',
  'TEMPO', 'UNITY', 'VENOM', 'WHALE', 'XENON', 'YOUTH', 'ZONES', 'ANGEL', 'BLAZE', 'CRUSH'
]

const WORD_LENGTH = 5
const MAX_GUESSES = 6

function Wordle() {
  const [targetWord, setTargetWord] = useState('')
  const [guesses, setGuesses] = useState([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('wordle_streak')
    return saved ? parseInt(saved) : 0
  })
  const [bestStreak, setBestStreak] = useState(() => {
    const saved = localStorage.getItem('wordle_best_streak')
    return saved ? parseInt(saved) : 0
  })
  const [gamesPlayed, setGamesPlayed] = useState(() => {
    const saved = localStorage.getItem('wordle_games_played')
    return saved ? parseInt(saved) : 0
  })

  const startNewGame = useCallback(() => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)]
    setTargetWord(randomWord)
    setGuesses([])
    setCurrentGuess('')
    setGameOver(false)
    setWon(false)
    setGameStarted(true)
  }, [])

  useEffect(() => {
    if (!gameStarted) {
      startNewGame()
    }
  }, [gameStarted, startNewGame])

  const getKeyStatus = (key, guesses, target) => {
    if (!target) return 'unused'

    let count = 0
    let correctCount = 0
    let presentCount = 0

    // Count occurrences in target
    for (const char of target) {
      if (char === key) count++
    }

    // Count correct and present
    for (let i = 0; i < guesses.length; i++) {
      for (let j = 0; j < guesses[i].length; j++) {
        if (guesses[i][j] === key) {
          if (guesses[i][j] === target[j]) {
            correctCount++
          } else {
            presentCount++
          }
        }
      }
    }

    if (correctCount >= count) return 'correct'
    if (correctCount + presentCount >= count) return 'present'
    return 'absent'
  }

  const handleKeyPress = useCallback((key) => {
    if (gameOver || !gameStarted) return

    if (key === 'ENTER') {
      if (currentGuess.length !== WORD_LENGTH) return
      if (!WORDS.includes(currentGuess)) {
        alert('Not in word list!')
        return
      }

      const newGuesses = [...guesses, currentGuess]
      setGuesses(newGuesses)
      setCurrentGuess('')

      if (currentGuess === targetWord) {
        setWon(true)
        setGameOver(true)
        const newStreak = streak + 1
        setStreak(newStreak)
        if (newStreak > bestStreak) {
          setBestStreak(newStreak)
          localStorage.setItem('wordle_best_streak', newStreak.toString())
        }
        localStorage.setItem('wordle_streak', newStreak.toString())
        setGamesPlayed(prev => {
          const newCount = prev + 1
          localStorage.setItem('wordle_games_played', newCount.toString())
          return newCount
        })
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true)
        setStreak(0)
        localStorage.setItem('wordle_streak', '0')
        setGamesPlayed(prev => {
          const newCount = prev + 1
          localStorage.setItem('wordle_games_played', newCount.toString())
          return newCount
        })
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => prev + key)
    }
  }, [currentGuess, guesses, targetWord, gameOver, gameStarted, streak, bestStreak])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleKeyPress('ENTER')
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE')
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyPress])

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Wordle</h1>

      {/* Stats */}
      <div className="flex gap-6 mb-4 text-sm">
        <div className="text-center">
          <p className="text-gray-400">Streak</p>
          <p className="text-2xl font-bold text-green-400">{streak}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400">Best</p>
          <p className="text-2xl font-bold text-yellow-400">{bestStreak}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400">Played</p>
          <p className="text-2xl font-bold">{gamesPlayed}</p>
        </div>
      </div>

      {/* Game Result */}
      {gameOver && (
        <div className={`rounded-xl p-6 mb-6 text-center ${won ? 'bg-green-800' : 'bg-red-800'}`}>
          {won ? (
            <>
              <p className="text-3xl font-bold mb-2">You Won!</p>
              <p className="text-gray-300">in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold mb-2">Game Over!</p>
              <p className="text-gray-300">The word was: <span className="font-bold text-white">{targetWord}</span></p>
            </>
          )}
        </div>
      )}

      {/* Board */}
      <div className="grid grid-rows-6 gap-2 mb-6">
        {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
          const guess = rowIndex < guesses.length
            ? guesses[rowIndex]
            : rowIndex === guesses.length
              ? currentGuess
              : ''

          const isCurrentRow = rowIndex === guesses.length
          const isSubmittedRow = rowIndex < guesses.length
          const target = targetWord

          return (
            <div key={rowIndex} className="grid grid-cols-5 gap-2">
              {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                const char = guess[colIndex] || ''
                let bgColor = 'bg-gray-700'
                let borderColor = 'border-gray-600'
                let textColor = 'text-white'

                if (isSubmittedRow && target) {
                  if (char === target[colIndex]) {
                    bgColor = 'bg-green-600'
                    borderColor = 'border-green-600'
                  } else if (target.includes(char)) {
                    bgColor = 'bg-yellow-600'
                    borderColor = 'border-yellow-600'
                  } else {
                    bgColor = 'bg-gray-600'
                    borderColor = 'border-gray-600'
                  }
                  textColor = 'text-white'
                } else if (isCurrentRow && char) {
                  borderColor = 'border-gray-400'
                }

                return (
                  <div
                    key={colIndex}
                    className={`
                      w-14 h-14 sm:w-16 sm:h-16
                      flex items-center justify-center
                      text-2xl sm:text-3xl font-bold
                      border-4 rounded-lg
                      transition-all duration-200
                      ${bgColor} ${borderColor} ${textColor}
                      ${isCurrentRow && char ? 'animate-pulse' : ''}
                    `}
                  >
                    {char}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Current Guess Display */}
      {gameStarted && !gameOver && (
        <p className="text-gray-400 mb-4 text-sm">
          {guesses.length === 0 && 'Guess the 5-letter word!'}
          {guesses.length > 0 && guesses.length < MAX_GUESSES && !won && ` ${MAX_GUESSES - guesses.length} guesses remaining`}
        </p>
      )}

      {/* Keyboard */}
      <div className="flex flex-col gap-2">
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 justify-center">
            {row.map((key) => {
              const status = getKeyStatus(key, guesses, targetWord)
              let bgColor = 'bg-gray-700 hover:bg-gray-600'
              if (status === 'correct') bgColor = 'bg-green-600 hover:bg-green-500'
              else if (status === 'present') bgColor = 'bg-yellow-600 hover:bg-yellow-500'
              else if (status === 'absent') bgColor = 'bg-gray-800 hover:bg-gray-700'

              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className={`
                    px-3 py-3 rounded-lg font-bold text-sm sm:text-base
                    transition-colors min-w-[40px]
                    ${bgColor} text-white
                    ${key === 'ENTER' || key === 'BACKSPACE' ? 'px-4' : ''}
                  `}
                >
                  {key === 'BACKSPACE' ? '←' : key}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* New Game Button */}
      <button
        onClick={startNewGame}
        className="mt-6 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        New Game
      </button>
    </div>
  )
}

export default Wordle
