import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const PADDLE_WIDTH = 130
const PADDLE_HEIGHT = 14
const BALL_RADIUS = 10
const BRICK_ROWS = 6
const BRICK_COLS = 8
const BRICK_WIDTH = 65
const BRICK_HEIGHT = 22
const BRICK_PADDING = 8
const BRICK_OFFSET_TOP = 60
const BRICK_OFFSET_LEFT = 25

const PADDLE_COLOR = '#63b3ed'
const BALL_COLOR = '#f7fafc'
const BRICK_COLORS = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5']

const BALL_SPEED = 180
const PADDLE_SPEED = 400

export default function Breakout() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)
  const paddleRef = useRef({ x: 0 })
  const ballRef = useRef({ x: 0, y: 0, dx: 0, dy: 0 })
  const bricksRef = useRef([])
  const gameStateRef = useRef('start')
  const scoreRef = useRef(0)
  const livesRef = useRef(5)
  const keysRef = useRef({ left: false, right: false })

  const [displayState, setDisplayState] = useState('start')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(5)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('breakout_best_score')
    return saved ? parseInt(saved) : null
  })

  const canvasWidth = BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING) - BRICK_PADDING + BRICK_OFFSET_LEFT * 2
  const canvasHeight = 520

  const initBricks = useCallback(() => {
    const bricks = []
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING),
          y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
          alive: true,
          color: BRICK_COLORS[r],
        })
      }
    }
    return bricks
  }, [])

  const resetBall = useCallback(() => {
    const angle = (Math.random() - 0.5) * Math.PI * 0.4
    ballRef.current = {
      x: canvasWidth / 2,
      y: canvasHeight - 60,
      dx: BALL_SPEED * Math.sin(angle),
      dy: -BALL_SPEED * Math.cos(angle),
    }
  }, [canvasWidth, canvasHeight])

  const resetGame = useCallback(() => {
    bricksRef.current = initBricks()
    paddleRef.current.x = (canvasWidth - PADDLE_WIDTH) / 2
    scoreRef.current = 0
    livesRef.current = 5
    setScore(0)
    setLives(5)
    resetBall()
    gameStateRef.current = 'playing'
    setDisplayState('playing')
  }, [canvasWidth, initBricks, resetBall])

  const startGame = useCallback(() => {
    bricksRef.current = initBricks()
    paddleRef.current.x = (canvasWidth - PADDLE_WIDTH) / 2
    scoreRef.current = 0
    livesRef.current = 5
    setScore(0)
    setLives(5)
    resetBall()
    gameStateRef.current = 'playing'
    setDisplayState('playing')
  }, [canvasWidth, initBricks, resetBall])

  const draw = useCallback((ctx) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.fillStyle = '#1a202c'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    bricksRef.current.forEach(brick => {
      if (brick.alive) {
        ctx.fillStyle = brick.color
        ctx.beginPath()
        ctx.roundRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, 4)
        ctx.fill()
      }
    })

    ctx.fillStyle = PADDLE_COLOR
    ctx.beginPath()
    ctx.roundRect(paddleRef.current.x, canvasHeight - PADDLE_HEIGHT - 15, PADDLE_WIDTH, PADDLE_HEIGHT, 6)
    ctx.fill()

    ctx.fillStyle = BALL_COLOR
    ctx.beginPath()
    ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }, [canvasWidth, canvasHeight])

  const gameLoop = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
    lastTimeRef.current = timestamp

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (gameStateRef.current !== 'playing') {
      draw(ctx)
      animationRef.current = requestAnimationFrame(gameLoop)
      return
    }

    const paddle = paddleRef.current
    const ball = ballRef.current

    if (keysRef.current.left) {
      paddle.x -= PADDLE_SPEED * deltaTime
    }
    if (keysRef.current.right) {
      paddle.x += PADDLE_SPEED * deltaTime
    }
    paddle.x = Math.max(0, Math.min(canvasWidth - PADDLE_WIDTH, paddle.x))

    ball.x += ball.dx * deltaTime
    ball.y += ball.dy * deltaTime

    if (ball.x - BALL_RADIUS <= 0) {
      ball.dx = Math.abs(ball.dx)
      ball.x = BALL_RADIUS
    }
    if (ball.x + BALL_RADIUS >= canvasWidth) {
      ball.dx = -Math.abs(ball.dx)
      ball.x = canvasWidth - BALL_RADIUS
    }
    if (ball.y - BALL_RADIUS <= 0) {
      ball.dy = Math.abs(ball.dy)
      ball.y = BALL_RADIUS
    }

    if (
      ball.y + BALL_RADIUS >= canvasHeight - PADDLE_HEIGHT - 15 &&
      ball.y - BALL_RADIUS <= canvasHeight - 15 &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + PADDLE_WIDTH
    ) {
      const hitPos = (ball.x - paddle.x) / PADDLE_WIDTH
      const angle = (hitPos - 0.5) * Math.PI * 0.5
      const speed = BALL_SPEED
      ball.dx = speed * Math.sin(angle)
      ball.dy = -speed * Math.cos(angle)
      ball.y = canvasHeight - PADDLE_HEIGHT - 15 - BALL_RADIUS
    }

    if (ball.y + BALL_RADIUS >= canvasHeight) {
      livesRef.current -= 1
      setLives(livesRef.current)

      if (livesRef.current <= 0) {
        gameStateRef.current = 'lost'
        setDisplayState('lost')
        if (scoreRef.current > (bestScore || 0)) {
          setBestScore(scoreRef.current)
          localStorage.setItem('breakout_best_score', scoreRef.current.toString())
        }
      } else {
        resetBall()
      }
      draw(ctx)
      animationRef.current = requestAnimationFrame(gameLoop)
      return
    }

    bricksRef.current.forEach(brick => {
      if (!brick.alive) return
      if (
        ball.x + BALL_RADIUS > brick.x &&
        ball.x - BALL_RADIUS < brick.x + BRICK_WIDTH &&
        ball.y + BALL_RADIUS > brick.y &&
        ball.y - BALL_RADIUS < brick.y + BRICK_HEIGHT
      ) {
        brick.alive = false
        const overlapLeft = ball.x + BALL_RADIUS - brick.x
        const overlapRight = brick.x + BRICK_WIDTH - (ball.x - BALL_RADIUS)
        const overlapTop = ball.y + BALL_RADIUS - brick.y
        const overlapBottom = brick.y + BRICK_HEIGHT - (ball.y - BALL_RADIUS)
        const minOverlapX = Math.min(overlapLeft, overlapRight)
        const minOverlapY = Math.min(overlapTop, overlapBottom)
        if (minOverlapX < minOverlapY) {
          ball.dx = -ball.dx
        } else {
          ball.dy = -ball.dy
        }
        scoreRef.current += 10
        setScore(scoreRef.current)
      }
    })

    if (bricksRef.current.every(b => !b.alive)) {
      gameStateRef.current = 'won'
      setDisplayState('won')
      if (scoreRef.current > (bestScore || 0)) {
        setBestScore(scoreRef.current)
        localStorage.setItem('breakout_best_score', scoreRef.current.toString())
      }
    }

    draw(ctx)
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [canvasWidth, canvasHeight, draw, resetBall, bestScore])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        keysRef.current.left = true
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        keysRef.current.right = true
      }
    }

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const mouseX = (e.clientX - rect.left) * scaleX
      paddleRef.current.x = Math.max(0, Math.min(canvasWidth - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2))
    }

    const handleTouchMove = (e) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const touchX = (e.touches[0].clientX - rect.left) * scaleX
      paddleRef.current.x = Math.max(0, Math.min(canvasWidth - PADDLE_WIDTH, touchX - PADDLE_WIDTH / 2))
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchmove', handleTouchMove)
    }
  }, [canvasWidth])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Breakout</h1>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Score</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Lives</p>
            <p className="text-2xl font-bold">{'❤️'.repeat(lives)}</p>
          </div>
          {bestScore !== null && (
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <p className="text-gray-400 text-sm">Best</p>
              <p className="text-2xl font-bold">{bestScore}</p>
            </div>
          )}
        </div>

        {displayState === 'start' && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-3xl font-bold mb-4">Breakout</p>
            <p className="text-gray-400 mb-6">Use mouse or arrow keys to move the paddle</p>
            <button
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {displayState === 'won' && (
          <div className="bg-green-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-3xl font-bold mb-2">You Win!</p>
            <p className="text-lg mb-4">Score: {score}</p>
            <button
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {displayState === 'lost' && (
          <div className="bg-red-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-3xl font-bold mb-2">Game Over!</p>
            <p className="text-lg mb-4">Score: {score}</p>
            <button
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="rounded-lg shadow-lg cursor-none"
            style={{ touchAction: 'none', maxWidth: '100%' }}
          />
        </div>

        <div className="mt-6 text-center text-gray-400">
          <p>Move mouse or use ← → keys to control paddle</p>
          <p className="text-sm mt-1">Break all bricks to win!</p>
        </div>
      </div>
    </div>
  )
}
