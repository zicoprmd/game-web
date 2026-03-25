import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SPEED = 150

function Snake() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }])
  const [food, setFood] = useState({ x: 15, y: 15 })
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore')
    return saved ? parseInt(saved) : 0
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const directionRef = useRef({ x: 0, y: 0 })
  const foodRef = useRef(food)
  const isPausedRef = useRef(isPaused)

  useEffect(() => {
    foodRef.current = food
  }, [food])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  const generateFood = useCallback((currentSnake) => {
    let newFood
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood({ x: 15, y: 15 })
    directionRef.current = { x: 0, y: 0 }
    foodRef.current = { x: 15, y: 15 }
    setGameOver(false)
    setScore(0)
    setIsPaused(false)
    isPausedRef.current = false
  }

  const startGame = () => {
    resetGame()
    setIsPlaying(true)
  }

  const handleKeyPress = useCallback((e) => {
    if (!isPlaying) return

    if (e.key === ' ') {
      e.preventDefault()
      setIsPaused(prev => {
        isPausedRef.current = !prev
        return !prev
      })
      return
    }

    if (isPausedRef.current) return

    switch (e.key) {
      case 'ArrowUp':
        if (directionRef.current.y !== 1) directionRef.current = { x: 0, y: -1 }
        break
      case 'ArrowDown':
        if (directionRef.current.y !== -1) directionRef.current = { x: 0, y: 1 }
        break
      case 'ArrowLeft':
        if (directionRef.current.x !== 1) directionRef.current = { x: -1, y: 0 }
        break
      case 'ArrowRight':
        if (directionRef.current.x !== -1) directionRef.current = { x: 1, y: 0 }
        break
    }
  }, [isPlaying])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  useEffect(() => {
    if (!isPlaying || gameOver) return

    const gameLoop = setInterval(() => {
      if (isPausedRef.current) return

      setSnake(prevSnake => {
        const direction = directionRef.current

        // Skip if no direction set yet
        if (direction.x === 0 && direction.y === 0) return prevSnake

        const head = {
          x: prevSnake[0].x + direction.x,
          y: prevSnake[0].y + direction.y
        }

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true)
          setIsPlaying(false)
          return prevSnake
        }

        // Self collision (skip head which is at index 0)
        for (let i = 1; i < prevSnake.length; i++) {
          if (prevSnake[i].x === head.x && prevSnake[i].y === head.y) {
            setGameOver(true)
            setIsPlaying(false)
            return prevSnake
          }
        }

        const newSnake = [head, ...prevSnake]

        // Food collision
        if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
          setScore(prev => {
            const newScore = prev + 10
            if (newScore > highScore) {
              setHighScore(newScore)
              localStorage.setItem('snakeHighScore', newScore.toString())
            }
            return newScore
          })
          setFood(generateFood(newSnake))
          return newSnake
        }

        newSnake.pop()
        return newSnake
      })
    }, INITIAL_SPEED)

    return () => clearInterval(gameLoop)
  }, [isPlaying, gameOver, generateFood, highScore])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Snake</h1>

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

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4 mt-8">
          {gameOver && <p className="text-red-400 text-xl mb-2">Game Over!</p>}
          <p className="text-gray-400 mb-2">Use arrow keys to move, space to pause</p>
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            {gameOver ? 'Play Again' : 'Start Game'}
          </button>
        </div>
      ) : (
        <>
          {isPaused && (
            <div className="bg-black/70 px-8 py-4 rounded-lg mb-4">
              <p className="text-2xl font-bold">Paused</p>
              <p className="text-gray-400 text-sm mt-2">Press Space to resume</p>
            </div>
          )}

          <div
            className="relative bg-gray-800 border-4 border-gray-600 rounded"
            style={{
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE
            }}
          >
            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute rounded-sm ${index === 0 ? 'bg-green-400' : 'bg-green-600'}`}
                style={{
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                  left: segment.x * CELL_SIZE + 1,
                  top: segment.y * CELL_SIZE + 1
                }}
              />
            ))}
            <div
              className="absolute bg-red-500 rounded-sm"
              style={{
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                left: food.x * CELL_SIZE + 1,
                top: food.y * CELL_SIZE + 1
              }}
            />
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => { resetGame(); setIsPlaying(false) }}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Quit
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Snake
