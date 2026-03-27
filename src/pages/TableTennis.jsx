import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400
const TABLE_WIDTH = 500
const TABLE_HEIGHT = 300
const NET_HEIGHT = 120
const NET_WIDTH = 6
const PADDLE_WIDTH = 80
const PADDLE_HEIGHT = 12
const BALL_RADIUS = 8
const BALL_SPEED = 7
const PADDLE_SPEED = 8

export default function TableTennis() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)
  const gameStateRef = useRef('start')
  const scoreRef = useRef({ player1: 0, player2: 0 })
  const bestScoreRef = useRef({ player1: 0, player2: 0 })

  const [displayState, setDisplayState] = useState('start')
  const [score, setScore] = useState({ player1: 0, player2: 0 })
  const [bestScore, setBestScore] = useState({ player1: 0, player2: 0 })

  const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: BALL_SPEED, dy: BALL_SPEED * 0.5, serving: true, servingPlayer: 1 })
  const paddle1Ref = useRef({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: 30 })
  const paddle2Ref = useRef({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 42 })
  const keysRef = useRef({ left: false, right: false })

  useEffect(() => {
    const saved = localStorage.getItem('tabletennis_best')
    if (saved) {
      const parsed = JSON.parse(saved)
      bestScoreRef.current = parsed
      setBestScore(parsed)
    }
  }, [])

  const resetBall = useCallback((servingPlayer) => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: servingPlayer === 1 ? BALL_SPEED : -BALL_SPEED,
      dy: (Math.random() - 0.5) * BALL_SPEED,
      serving: true,
      servingPlayer
    }
  }, [])

  const startGame = useCallback(() => {
    scoreRef.current = { player1: 0, player2: 0 }
    setScore({ player1: 0, player2: 0 })
    paddle1Ref.current = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: 30 }
    paddle2Ref.current = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 42 }
    resetBall(1)
    gameStateRef.current = 'playing'
    setDisplayState('playing')
  }, [resetBall])

  const resetGame = useCallback(() => {
    scoreRef.current = { player1: 0, player2: 0 }
    setScore({ player1: 0, player2: 0 })
    paddle1Ref.current = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: 30 }
    paddle2Ref.current = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 42 }
    resetBall(1)
    gameStateRef.current = 'playing'
    setDisplayState('playing')
  }, [resetBall])

  const drawTable = useCallback((ctx) => {
    // Table background
    ctx.fillStyle = '#1e5128'
    ctx.fillRect((CANVAS_WIDTH - TABLE_WIDTH) / 2, (CANVAS_HEIGHT - TABLE_HEIGHT) / 2, TABLE_WIDTH, TABLE_HEIGHT)

    // Table border
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 4
    ctx.strokeRect((CANVAS_WIDTH - TABLE_WIDTH) / 2, (CANVAS_HEIGHT - TABLE_HEIGHT) / 2, TABLE_WIDTH, TABLE_HEIGHT)

    // Center line
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo((CANVAS_WIDTH - TABLE_WIDTH) / 2, CANVAS_HEIGHT / 2)
    ctx.lineTo((CANVAS_WIDTH + TABLE_WIDTH) / 2, CANVAS_HEIGHT / 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Net
    const netX = CANVAS_WIDTH / 2 - NET_WIDTH / 2
    const netY = CANVAS_HEIGHT / 2 - NET_HEIGHT / 2
    ctx.fillStyle = '#fff'
    ctx.fillRect(netX, netY, NET_WIDTH, NET_HEIGHT)

    // Net posts
    ctx.fillStyle = '#ddd'
    ctx.fillRect(netX - 3, netY - 5, NET_WIDTH + 6, 10)
    ctx.fillRect(netX - 3, netY + NET_HEIGHT - 5, NET_WIDTH + 6, 10)
  }, [])

  const drawPaddle = useCallback((ctx, paddle, isPlayer1) => {
    ctx.fillStyle = isPlayer1 ? '#3498db' : '#e74c3c'
    ctx.beginPath()
    ctx.roundRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6)
    ctx.fill()

    // Paddle shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.roundRect(paddle.x, paddle.y + 4, PADDLE_WIDTH, PADDLE_HEIGHT, 6)
    ctx.fill()
  }, [])

  const drawBall = useCallback((ctx, ball) => {
    // Ball shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.arc(ball.x + 3, ball.y + 3, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Ball
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Ball highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    ctx.arc(ball.x - 2, ball.y - 2, BALL_RADIUS / 3, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const draw = useCallback((ctx) => {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Table area background
    ctx.fillStyle = '#0d1b0f'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    drawTable(ctx)

    const paddle1 = paddle1Ref.current
    const paddle2 = paddle2Ref.current
    const ball = ballRef.current

    drawPaddle(ctx, paddle1, true)
    drawPaddle(ctx, paddle2, false)
    drawBall(ctx, ball)

    // Score display
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(scoreRef.current.player1, CANVAS_WIDTH / 4, 80)
    ctx.fillText(scoreRef.current.player2, (CANVAS_WIDTH * 3) / 4, CANVAS_HEIGHT - 30)

    // Labels
    ctx.font = '14px Arial'
    ctx.fillStyle = '#3498db'
    ctx.fillText('YOU', CANVAS_WIDTH / 4, 100)
    ctx.fillStyle = '#e74c3c'
    ctx.fillText('CPU', (CANVAS_WIDTH * 3) / 4, CANVAS_HEIGHT - 15)

    // Serving indicator
    if (ball.serving && gameStateRef.current === 'playing') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = '16px Arial'
      ctx.fillText(ball.servingPlayer === 1 ? 'Your serve' : 'CPU serve', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
    }
  }, [drawTable, drawPaddle, drawBall])

  const gameLoop = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 16.67, 2)
    lastTimeRef.current = timestamp

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (gameStateRef.current !== 'playing') {
      draw(ctx)
      animationRef.current = requestAnimationFrame(gameLoop)
      return
    }

    const paddle1 = paddle1Ref.current
    const paddle2 = paddle2Ref.current
    const ball = ballRef.current

    // Player 1 movement (you - top)
    if (keysRef.current.left) {
      paddle1.x = Math.max((CANVAS_WIDTH - TABLE_WIDTH) / 2, paddle1.x - PADDLE_SPEED * deltaTime)
    }
    if (keysRef.current.right) {
      paddle1.x = Math.min((CANVAS_WIDTH + TABLE_WIDTH) / 2 - PADDLE_WIDTH, paddle1.x + PADDLE_SPEED * deltaTime)
    }

    // CPU AI (player 2 - bottom)
    const cpuSpeed = 5
    const targetX = ball.x - PADDLE_WIDTH / 2
    if (ball.dx > 0 && ball.servingPlayer === 1) {
      // Ball coming towards CPU
      if (paddle2.x < targetX) {
        paddle2.x = Math.min((CANVAS_WIDTH + TABLE_WIDTH) / 2 - PADDLE_WIDTH, paddle2.x + cpuSpeed * deltaTime)
      } else {
        paddle2.x = Math.max((CANVAS_WIDTH - TABLE_WIDTH) / 2, paddle2.x - cpuSpeed * deltaTime)
      }
    }

    // Ball movement
    if (ball.serving) {
      // Ball follows server
      if (ball.servingPlayer === 1) {
        ball.x = paddle1.x + PADDLE_WIDTH / 2
        ball.y = paddle1.y + PADDLE_HEIGHT + BALL_RADIUS + 2
      } else {
        ball.x = paddle2.x + PADDLE_WIDTH / 2
        ball.y = paddle2.y - BALL_RADIUS - 2
      }
    } else {
      ball.x += ball.dx * deltaTime
      ball.y += ball.dy * deltaTime
    }

    // Table boundaries for ball
    const leftBound = (CANVAS_WIDTH - TABLE_WIDTH) / 2
    const rightBound = (CANVAS_WIDTH + TABLE_WIDTH) / 2

    // Ball side walls
    if (ball.x - BALL_RADIUS <= leftBound) {
      ball.x = leftBound + BALL_RADIUS
      ball.dx = Math.abs(ball.dx)
    }
    if (ball.x + BALL_RADIUS >= rightBound) {
      ball.x = rightBound - BALL_RADIUS
      ball.dx = -Math.abs(ball.dx)
    }

    // Ball hits top of table - player 2 scores
    if (ball.y - BALL_RADIUS <= (CANVAS_HEIGHT - TABLE_HEIGHT) / 2) {
      if (!ball.serving) {
        scoreRef.current.player2 += 1
        setScore({ ...scoreRef.current })
        ball.serving = true
        ball.servingPlayer = 1
        setTimeout(() => {
          ball.serving = false
          ball.dx = BALL_SPEED
          ball.dy = BALL_SPEED * 0.5
        }, 1000)
      }
    }

    // Ball hits bottom of table - player 1 scores
    if (ball.y + BALL_RADIUS >= (CANVAS_HEIGHT + TABLE_HEIGHT) / 2) {
      if (!ball.serving) {
        scoreRef.current.player1 += 1
        setScore({ ...scoreRef.current })
        ball.serving = true
        ball.servingPlayer = 2
        setTimeout(() => {
          ball.serving = false
          ball.dx = -BALL_SPEED
          ball.dy = -BALL_SPEED * 0.5
        }, 1000)
      }
    }

    // Paddle 1 collision (player)
    if (!ball.serving && ball.dy < 0) {
      if (ball.y - BALL_RADIUS <= paddle1.y + PADDLE_HEIGHT &&
          ball.y + BALL_RADIUS >= paddle1.y &&
          ball.x >= paddle1.x - BALL_RADIUS &&
          ball.x <= paddle1.x + PADDLE_WIDTH + BALL_RADIUS) {
        ball.y = paddle1.y + PADDLE_HEIGHT + BALL_RADIUS
        const hitPos = (ball.x - paddle1.x) / PADDLE_WIDTH
        ball.dy = Math.abs(ball.dy) * (0.8 + Math.random() * 0.4)
        ball.dx = (hitPos - 0.5) * BALL_SPEED * 2
        // Ensure minimum upward speed
        if (ball.dy < 3) ball.dy = 3
      }
    }

    // Paddle 2 collision (CPU)
    if (!ball.serving && ball.dy > 0) {
      if (ball.y + BALL_RADIUS >= paddle2.y &&
          ball.y - BALL_RADIUS <= paddle2.y + PADDLE_HEIGHT &&
          ball.x >= paddle2.x - BALL_RADIUS &&
          ball.x <= paddle2.x + PADDLE_WIDTH + BALL_RADIUS) {
        ball.y = paddle2.y - BALL_RADIUS
        const hitPos = (ball.x - paddle2.x) / PADDLE_WIDTH
        ball.dy = -Math.abs(ball.dy) * (0.8 + Math.random() * 0.4)
        ball.dx = (hitPos - 0.5) * BALL_SPEED * 2
        // Ensure minimum downward speed
        if (ball.dy > -3) ball.dy = -3
      }
    }

    draw(ctx)
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [draw])

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
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (gameStateRef.current === 'start') {
          startGame()
        } else if (gameStateRef.current === 'playing' && ballRef.current.serving) {
          ballRef.current.serving = false
        } else if (gameStateRef.current === 'lost') {
          resetGame()
        }
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
  }, [startGame, resetGame])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Table Tennis</h1>

      {displayState === 'start' && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
          <p className="text-3xl font-bold mb-4">Table Tennis</p>
          <p className="text-gray-400 mb-2">First to 11 points wins!</p>
          <p className="text-gray-400 text-sm mb-4">Use ← → or A/D keys to move</p>
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            Start Game
          </button>
        </div>
      )}

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg shadow-lg border-2 border-gray-600"
        />
      </div>

      <div className="mt-6 text-center text-gray-400">
        <p>← → or A/D to move paddle</p>
        <p className="text-sm mt-1">Press SPACE to serve or restart</p>
      </div>
    </div>
  )
}
