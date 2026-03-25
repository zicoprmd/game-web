import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const PADDLE_WIDTH = 10
const PADDLE_HEIGHT = 80
const BALL_SIZE = 10
const BALL_SPEED = 6
const PADDLE_SPEED = 8
const WIN_SCORE = 5

function Pong() {
  const [playerY, setPlayerY] = useState(150)
  const [cpuY, setCpuY] = useState(150)
  const [ballPos, setBallPos] = useState({ x: 195, y: 195 })
  const [ballVel, setBallVel] = useState({ x: BALL_SPEED, y: 0 })
  const [playerScore, setPlayerScore] = useState(0)
  const [cpuScore, setCpuScore] = useState(0)
  const [gameOver, setGameOver] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const keysRef = useRef({})
  const ballPosRef = useRef(ballPos)
  const ballVelRef = useRef(ballVel)
  const playerYRef = useRef(playerY)
  const cpuYRef = useRef(cpuY)

  useEffect(() => { ballPosRef.current = ballPos }, [ballPos])
  useEffect(() => { ballVelRef.current = ballVel }, [ballVel])
  useEffect(() => { playerYRef.current = playerY }, [playerY])
  useEffect(() => { cpuYRef.current = cpuY }, [cpuY])

  const resetBall = useCallback(() => {
    setBallPos({ x: 195, y: 195 })
    setBallVel({ x: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1), y: (Math.random() - 0.5) * 4 })
  }, [])

  const resetGame = useCallback(() => {
    setPlayerY(150)
    setCpuY(150)
    playerYRef.current = 150
    cpuYRef.current = 150
    setPlayerScore(0)
    setCpuScore(0)
    resetBall()
    setGameOver(null)
    setIsPaused(false)
  }, [resetBall])

  const startGame = useCallback(() => {
    resetGame()
    setIsPlaying(true)
  }, [resetGame])

  const handleKeyDown = useCallback((e) => {
    keysRef.current[e.key] = true
    if (e.key === ' ') {
      e.preventDefault()
      if (isPlaying && !gameOver) {
        setIsPaused(prev => !prev)
      }
    }
  }, [isPlaying, gameOver])

  const handleKeyUp = useCallback((e) => {
    keysRef.current[e.key] = false
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return

    const gameLoop = setInterval(() => {
      const canvasHeight = 400

      // Player movement
      setPlayerY(prev => {
        let newY = prev
        if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) {
          newY = Math.max(0, prev - PADDLE_SPEED)
        }
        if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) {
          newY = Math.min(canvasHeight - PADDLE_HEIGHT, prev + PADDLE_SPEED)
        }
        return newY
      })

      // Ball movement
      setBallPos(prev => {
        let newX = prev.x + ballVelRef.current.x
        let newY = prev.y + ballVelRef.current.y
        let velX = ballVelRef.current.x
        let velY = ballVelRef.current.y

        // Top/bottom wall collision
        if (newY <= 0 || newY >= canvasHeight - BALL_SIZE) {
          velY = -velY
          newY = Math.max(0, Math.min(canvasHeight - BALL_SIZE, newY))
        }

        // Player paddle collision (left side)
        if (newX <= 20 && newX >= 10 && newY + BALL_SIZE >= playerYRef.current && newY <= playerYRef.current + PADDLE_HEIGHT) {
          velX = Math.abs(velX)
          const hitPos = (newY + BALL_SIZE / 2 - playerYRef.current) / PADDLE_HEIGHT
          velY = (hitPos - 0.5) * 8
        }

        // CPU paddle collision (right side)
        if (newX >= 370 && newX <= 380 && newY + BALL_SIZE >= cpuYRef.current && newY <= cpuYRef.current + PADDLE_HEIGHT) {
          velX = -Math.abs(velX)
          const hitPos = (newY + BALL_SIZE / 2 - cpuYRef.current) / PADDLE_HEIGHT
          velY = (hitPos - 0.5) * 8
        }

        // Score
        if (newX < 0) {
          setCpuScore(prev => {
            const newScore = prev + 1
            if (newScore >= WIN_SCORE) setGameOver('CPU')
            return newScore
          })
          setTimeout(resetBall, 500)
          return { x: 195, y: 195 }
        }
        if (newX > 400 - BALL_SIZE) {
          setPlayerScore(prev => {
            const newScore = prev + 1
            if (newScore >= WIN_SCORE) setGameOver('Player')
            return newScore
          })
          setTimeout(resetBall, 500)
          return { x: 195, y: 195 }
        }

        setBallVel({ x: velX, y: velY })
        return { x: newX, y: newY }
      })

      // CPU AI
      setCpuY(prev => {
        const cpuCenter = prev + PADDLE_HEIGHT / 2
        const ballCenter = ballPosRef.current.y + BALL_SIZE / 2
        const diff = ballCenter - cpuCenter

        if (Math.abs(diff) > 5) {
          if (diff > 0) {
            return Math.min(400 - PADDLE_HEIGHT, prev + 4)
          } else {
            return Math.max(0, prev - 4)
          }
        }
        return prev
      })

    }, 1000 / 60)

    return () => clearInterval(gameLoop)
  }, [isPlaying, isPaused, gameOver, resetBall])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Pong</h1>

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-gray-400 mb-2">First to {WIN_SCORE} wins!</p>
          <p className="text-gray-400 text-sm mb-2">Player: W/S or Arrow Up/Down | Space to pause</p>
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-12 mb-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Player</p>
              <p className="text-3xl font-bold text-blue-400">{playerScore}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">CPU</p>
              <p className="text-3xl font-bold text-red-400">{cpuScore}</p>
            </div>
          </div>

          {isPaused && (
            <div className="bg-black/70 px-8 py-4 rounded-lg mb-4">
              <p className="text-2xl font-bold">Paused</p>
              <p className="text-gray-400 text-sm mt-2">Press Space to resume</p>
            </div>
          )}

          {gameOver && (
            <div className="bg-black/70 px-8 py-4 rounded-lg mb-4">
              <p className="text-2xl font-bold text-yellow-400">{gameOver} Wins!</p>
            </div>
          )}

          <div
            className="relative bg-black border-4 border-gray-600 rounded"
            style={{ width: 400, height: 400 }}
          >
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-600 transform -translate-x-1/2" />

            {/* Player paddle */}
            <div
              className="absolute bg-blue-500 rounded"
              style={{
                width: PADDLE_WIDTH,
                height: PADDLE_HEIGHT,
                left: 10,
                top: playerY
              }}
            />

            {/* CPU paddle */}
            <div
              className="absolute bg-red-500 rounded"
              style={{
                width: PADDLE_WIDTH,
                height: PADDLE_HEIGHT,
                right: 10,
                top: cpuY
              }}
            />

            {/* Ball */}
            <div
              className="absolute bg-white rounded"
              style={{
                width: BALL_SIZE,
                height: BALL_SIZE,
                left: ballPos.x,
                top: ballPos.y
              }}
            />
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => { resetGame(); setIsPlaying(false); setGameOver(null) }}
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

export default Pong
