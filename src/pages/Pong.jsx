import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const PADDLE_WIDTH = 10
const PADDLE_HEIGHT = 80
const BALL_SIZE = 10
const BALL_SPEED = 5
const WIN_SCORE = 5
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 400
const PADDLE_SPEED = 350

function Pong() {
  const [playerY, setPlayerY] = useState(150)
  const [cpuY, setCpuY] = useState(150)
  const [ballPos, setBallPos] = useState({ x: 200, y: 200 })
  const [playerScore, setPlayerScore] = useState(0)
  const [cpuScore, setCpuScore] = useState(0)
  const [gameOver, setGameOver] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const keysRef = useRef({})
  const playerYRef = useRef(playerY)
  const cpuYRef = useRef(cpuY)
  const ballPosRef = useRef({ x: 200, y: 200 })
  const ballVelRef = useRef({ x: BALL_SPEED, y: 0 })
  const touchYRef = useRef(null)
  const gameLoopRef = useRef(null)
  const lastTimeRef = useRef(0)

  useEffect(() => { playerYRef.current = playerY }, [playerY])
  useEffect(() => { cpuYRef.current = cpuY }, [cpuY])
  useEffect(() => { ballPosRef.current = ballPos }, [ballPos])

  const resetBall = useCallback(() => {
    const newVel = {
      x: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      y: (Math.random() - 0.5) * 4
    }
    ballVelRef.current = newVel
    ballPosRef.current = { x: 200, y: 200 }
    setBallPos({ x: 200, y: 200 })
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

  const handleTouchStart = useCallback((e) => {
    if (!isPlaying || gameOver) return
    const touch = e.touches[0]
    const rect = e.target.getBoundingClientRect()
    touchYRef.current = touch.clientY - rect.top
  }, [isPlaying, gameOver])

  const handleTouchMove = useCallback((e) => {
    if (!isPlaying || gameOver) return
    e.preventDefault()
    const touch = e.touches[0]
    const rect = e.target.getBoundingClientRect()
    const touchY = touch.clientY - rect.top
    const newY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, touchY - PADDLE_HEIGHT / 2))
    setPlayerY(newY)
    playerYRef.current = newY
  }, [isPlaying, gameOver])

  const handleTouchEnd = useCallback(() => {
    touchYRef.current = null
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

    const update = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = timestamp

      // Player movement
      if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) {
        const newY = Math.max(0, playerYRef.current - PADDLE_SPEED * deltaTime)
        setPlayerY(newY)
        playerYRef.current = newY
      }
      if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) {
        const newY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerYRef.current + PADDLE_SPEED * deltaTime)
        setPlayerY(newY)
        playerYRef.current = newY
      }

      // Ball movement using refs
      let { x: ballX, y: ballY } = ballPosRef.current
      let { x: velX, y: velY } = ballVelRef.current

      ballX += velX * deltaTime * 60
      ballY += velY * deltaTime * 60

      // Top wall collision
      if (ballY <= 0) {
        ballY = 0
        velY = Math.abs(velY)
      }
      // Bottom wall collision
      if (ballY + BALL_SIZE >= CANVAS_HEIGHT) {
        ballY = CANVAS_HEIGHT - BALL_SIZE
        velY = -Math.abs(velY)
      }

      // Player paddle collision (left side, paddle at x=10)
      const paddleLeftX = 10
      if (ballX <= paddleLeftX + PADDLE_WIDTH &&
          ballX >= paddleLeftX - BALL_SIZE &&
          ballY + BALL_SIZE >= playerYRef.current &&
          ballY <= playerYRef.current + PADDLE_HEIGHT) {
        ballX = paddleLeftX + PADDLE_WIDTH
        velX = Math.abs(velX)
        const hitPos = (ballY + BALL_SIZE / 2 - playerYRef.current) / PADDLE_HEIGHT
        velY = (hitPos - 0.5) * 8
      }

      // CPU paddle collision (right side, paddle at x=370)
      const paddleRightX = 370
      if (ballX + BALL_SIZE >= paddleRightX &&
          ballX <= paddleRightX + PADDLE_WIDTH &&
          ballY + BALL_SIZE >= cpuYRef.current &&
          ballY <= cpuYRef.current + PADDLE_HEIGHT) {
        ballX = paddleRightX - BALL_SIZE
        velX = -Math.abs(velX)
        const hitPos = (ballY + BALL_SIZE / 2 - cpuYRef.current) / PADDLE_HEIGHT
        velY = (hitPos - 0.5) * 8
      }

      // Score when ball goes past paddles
      if (ballX < -BALL_SIZE) {
        setCpuScore(prev => {
          const newScore = prev + 1
          if (newScore >= WIN_SCORE) setGameOver('CPU')
          return newScore
        })
        setTimeout(resetBall, 500)
        ballX = -BALL_SIZE
        velX = 0
        velY = 0
      }
      if (ballX > CANVAS_WIDTH) {
        setPlayerScore(prev => {
          const newScore = prev + 1
          if (newScore >= WIN_SCORE) setGameOver('Player')
          return newScore
        })
        setTimeout(resetBall, 500)
        ballX = CANVAS_WIDTH
        velX = 0
        velY = 0
      }

      ballPosRef.current = { x: ballX, y: ballY }
      ballVelRef.current = { x: velX, y: velY }
      setBallPos({ x: ballX, y: ballY })

      // CPU AI - simple tracking
      const ballCenter = ballY + BALL_SIZE / 2
      const cpuCenter = cpuYRef.current + PADDLE_HEIGHT / 2
      const diff = ballCenter - cpuCenter

      if (Math.abs(diff) > 5) {
        let newCpuY
        if (diff > 0) {
          newCpuY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, cpuYRef.current + 4)
        } else {
          newCpuY = Math.max(0, cpuYRef.current - 4)
        }
        setCpuY(newCpuY)
        cpuYRef.current = newCpuY
      }

      gameLoopRef.current = requestAnimationFrame(update)
    }

    lastTimeRef.current = 0
    gameLoopRef.current = requestAnimationFrame(update)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [isPlaying, isPaused, gameOver, resetBall])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Pong</h1>

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-gray-400 mb-2">First to {WIN_SCORE} wins!</p>
          <p className="text-gray-400 text-sm mb-2">W/S or Arrow Up/Down to move | Space to pause</p>
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
            className="relative bg-black border-4 border-gray-600 rounded touch-none select-none"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-600 transform -translate-x-1/2" />
            <div
              className="absolute bg-blue-500 rounded"
              style={{
                width: PADDLE_WIDTH,
                height: PADDLE_HEIGHT,
                left: 10,
                top: playerY
              }}
            />
            <div
              className="absolute bg-red-500 rounded"
              style={{
                width: PADDLE_WIDTH,
                height: PADDLE_HEIGHT,
                right: 10,
                top: cpuY
              }}
            />
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

          {/* Touch controls for mobile */}
          <div className="flex gap-4 mt-6">
            <button
              onTouchStart={() => keysRef.current['ArrowUp'] = true}
              onTouchEnd={() => keysRef.current['ArrowUp'] = false}
              onMouseDown={() => keysRef.current['ArrowUp'] = true}
              onMouseUp={() => keysRef.current['ArrowUp'] = false}
              onMouseLeave={() => keysRef.current['ArrowUp'] = false}
              className="bg-blue-600 hover:bg-blue-500 w-16 h-16 rounded-lg text-2xl font-bold flex items-center justify-center active:bg-blue-700"
            >
              ↑
            </button>
            <button
              onTouchStart={() => keysRef.current['ArrowDown'] = true}
              onTouchEnd={() => keysRef.current['ArrowDown'] = false}
              onMouseDown={() => keysRef.current['ArrowDown'] = true}
              onMouseUp={() => keysRef.current['ArrowDown'] = false}
              onMouseLeave={() => keysRef.current['ArrowDown'] = false}
              className="bg-blue-600 hover:bg-blue-500 w-16 h-16 rounded-lg text-2xl font-bold flex items-center justify-center active:bg-blue-700"
            >
              ↓
            </button>
          </div>

          <div className="flex gap-4 mt-4">
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
