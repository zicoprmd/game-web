import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 450
// Table dimensions - centered in canvas
const TABLE_WIDTH = 500
const TABLE_HEIGHT = 300
const TABLE_TOP = (CANVAS_HEIGHT - TABLE_HEIGHT) / 2  // 75
const TABLE_BOTTOM = TABLE_TOP + TABLE_HEIGHT  // 375
const TABLE_LEFT = (CANVAS_WIDTH - TABLE_WIDTH) / 2  // 50
const TABLE_RIGHT = TABLE_LEFT + TABLE_WIDTH  // 550

// Net
const NET_HEIGHT = 120
const NET_WIDTH = 6
const NET_X = CANVAS_WIDTH / 2 - NET_WIDTH / 2
const NET_Y = CANVAS_HEIGHT / 2 - NET_HEIGHT / 2

// Paddles - player is BELOW table top, CPU is ABOVE table bottom
const PADDLE_WIDTH = 80
const PADDLE_HEIGHT = 12
const PADDLE1_Y = TABLE_TOP - PADDLE_HEIGHT - 15  // 48 - player's paddle (top)
const PADDLE2_Y = TABLE_BOTTOM + 15  // 390 - CPU's paddle (bottom)

// Ball
const BALL_RADIUS = 8
const INITIAL_BALL_SPEED = 350

export default function TableTennis() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)
  const gameStateRef = useRef('start')
  const scoreRef = useRef({ player1: 0, player2: 0 })

  const [displayState, setDisplayState] = useState('start')
  const [score, setScore] = useState({ player1: 0, player2: 0 })

  // Ball state
  const ballRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: 100,
    dx: 0,
    dy: 0,
    serving: true,
    servingPlayer: 1,
    speed: INITIAL_BALL_SPEED
  })

  // Paddle positions
  const paddle1Ref = useRef({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: PADDLE1_Y })
  const paddle2Ref = useRef({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: PADDLE2_Y })
  const keysRef = useRef({ left: false, right: false })

  const resetBall = useCallback((servingPlayer) => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: servingPlayer === 1 ? 150 : CANVAS_HEIGHT - 150,
      dx: 0,
      dy: 0,
      serving: true,
      servingPlayer,
      speed: INITIAL_BALL_SPEED
    }
  }, [])

  const serveBall = useCallback(() => {
    const ball = ballRef.current
    if (!ball.serving) return

    const angle = (Math.random() - 0.5) * Math.PI / 3
    const direction = ball.servingPlayer === 1 ? 1 : -1

    ball.dx = Math.sin(angle) * ball.speed
    ball.dy = Math.cos(angle) * ball.speed * direction
    ball.serving = false
  }, [])

  const startGame = useCallback(() => {
    scoreRef.current = { player1: 0, player2: 0 }
    setScore({ player1: 0, player2: 0 })
    paddle1Ref.current = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: PADDLE1_Y }
    paddle2Ref.current = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: PADDLE2_Y }
    resetBall(1)
    gameStateRef.current = 'playing'
    setDisplayState('playing')
  }, [resetBall])

  // Drawing functions
  const drawTable = useCallback((ctx) => {
    // Green table surface
    ctx.fillStyle = '#1e5128'
    ctx.fillRect(TABLE_LEFT, TABLE_TOP, TABLE_WIDTH, TABLE_HEIGHT)

    // White table border
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 4
    ctx.strokeRect(TABLE_LEFT, TABLE_TOP, TABLE_WIDTH, TABLE_HEIGHT)

    // Center line (dashed)
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(TABLE_LEFT, CANVAS_HEIGHT / 2)
    ctx.lineTo(TABLE_RIGHT, CANVAS_HEIGHT / 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Net
    ctx.fillStyle = '#fff'
    ctx.fillRect(NET_X, NET_Y, NET_WIDTH, NET_HEIGHT)

    // Net posts
    ctx.fillStyle = '#ddd'
    ctx.fillRect(NET_X - 3, NET_Y - 5, NET_WIDTH + 6, 10)
    ctx.fillRect(NET_X - 3, NET_Y + NET_HEIGHT - 5, NET_WIDTH + 6, 10)
  }, [])

  const drawPaddle = useCallback((ctx, paddle, color) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6)
    ctx.fill()
  }, [])

  const drawBall = useCallback((ctx, ball) => {
    if (ball.serving) {
      // Draw ball at serving position with indicator
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_RADIUS + 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    // Ball shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.arc(ball.x + 2, ball.y + 2, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Ball
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.beginPath()
    ctx.arc(ball.x - 2, ball.y - 2, BALL_RADIUS / 3, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const draw = useCallback((ctx) => {
    // Background
    ctx.fillStyle = '#0d1b0f'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Player area (bottom) and CPU area (top) - darker
    ctx.fillStyle = '#0a150a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, TABLE_TOP)
    ctx.fillRect(0, TABLE_BOTTOM, CANVAS_WIDTH, CANVAS_HEIGHT - TABLE_BOTTOM)

    drawTable(ctx)

    const paddle1 = paddle1Ref.current
    const paddle2 = paddle2Ref.current
    const ball = ballRef.current

    // Draw paddles
    drawPaddle(ctx, paddle1, '#3498db')  // Player - blue
    drawPaddle(ctx, paddle2, '#e74c3c')  // CPU - red

    // Draw ball
    drawBall(ctx, ball)

    // Score
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(scoreRef.current.player1, CANVAS_WIDTH / 4, 50)
    ctx.fillText(scoreRef.current.player2, (CANVAS_WIDTH * 3) / 4, CANVAS_HEIGHT - 20)

    // Labels
    ctx.font = '14px Arial'
    ctx.fillStyle = '#3498db'
    ctx.fillText('YOU', CANVAS_WIDTH / 4, 25)
    ctx.fillStyle = '#e74c3c'
    ctx.fillText('CPU', (CANVAS_WIDTH * 3) / 4, CANVAS_HEIGHT - 5)

    // Instructions
    if (ball.serving && gameStateRef.current === 'playing') {
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = '18px Arial'
      ctx.fillText('Press SPACE to serve', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
    }
  }, [drawTable, drawPaddle, drawBall])

  // Game loop
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

    const paddle1 = paddle1Ref.current
    const paddle2 = paddle2Ref.current
    const ball = ballRef.current

    // Player paddle movement
    const paddleSpeed = 500
    if (keysRef.current.left) {
      paddle1.x = Math.max(TABLE_LEFT, paddle1.x - paddleSpeed * deltaTime)
    }
    if (keysRef.current.right) {
      paddle1.x = Math.min(TABLE_RIGHT - PADDLE_WIDTH, paddle1.x + paddleSpeed * deltaTime)
    }

    // CPU AI - always track the ball
    const cpuSpeed = 320
    const targetX = ball.x - PADDLE_WIDTH / 2
    const diff = targetX - paddle2.x
    const cpuMove = cpuSpeed * deltaTime

    if (Math.abs(diff) > 3) {
      if (diff > 0) {
        paddle2.x = Math.min(TABLE_RIGHT - PADDLE_WIDTH, paddle2.x + cpuMove)
      } else {
        paddle2.x = Math.max(TABLE_LEFT, paddle2.x - cpuMove)
      }
    }

    // Ball movement (only when not serving)
    if (!ball.serving) {
      ball.x += ball.dx * deltaTime
      ball.y += ball.dy * deltaTime

      // Ball collision with SIDE walls (within table)
      if (ball.x - BALL_RADIUS <= TABLE_LEFT) {
        ball.x = TABLE_LEFT + BALL_RADIUS
        ball.dx = Math.abs(ball.dx)
      }
      if (ball.x + BALL_RADIUS >= TABLE_RIGHT) {
        ball.x = TABLE_RIGHT - BALL_RADIUS
        ball.dx = -Math.abs(ball.dx)
      }

      // Ball goes out at TOP - point for player 2 (CPU)
      if (ball.y - BALL_RADIUS <= TABLE_TOP) {
        scoreRef.current.player2 += 1
        setScore({ ...scoreRef.current })

        if (scoreRef.current.player2 >= 11) {
          gameStateRef.current = 'won'
          setDisplayState('won')
        } else {
          resetBall(1)  // Player 1 (you) serves next
        }
      }

      // Ball goes out at BOTTOM - point for player 1 (you)
      if (ball.y + BALL_RADIUS >= TABLE_BOTTOM) {
        scoreRef.current.player1 += 1
        setScore({ ...scoreRef.current })

        if (scoreRef.current.player1 >= 11) {
          gameStateRef.current = 'won'
          setDisplayState('won')
        } else {
          resetBall(2)  // Player 2 (CPU) serves next
        }
      }

      // Player paddle (TOP paddle - blue) collision
      // Ball going UP and reaches paddle
      if (ball.dy < 0) {
        const paddleTop = paddle1.y + PADDLE_HEIGHT
        if (ball.y - BALL_RADIUS <= paddleTop &&
            ball.y + BALL_RADIUS >= paddle1.y &&
            ball.x >= paddle1.x - BALL_RADIUS &&
            ball.x <= paddle1.x + PADDLE_WIDTH + BALL_RADIUS) {

          // Bounce!
          ball.y = paddleTop + BALL_RADIUS

          // Angle based on hit position
          const hitPos = (ball.x - paddle1.x) / PADDLE_WIDTH
          const angle = (hitPos - 0.5) * Math.PI / 2.5
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)

          ball.dx = Math.sin(angle) * speed
          ball.dy = -Math.cos(angle) * speed
        }
      }

      // CPU paddle (BOTTOM paddle - red) collision
      // Ball going DOWN and reaches paddle
      if (ball.dy > 0) {
        const paddleBottom = paddle2.y
        if (ball.y + BALL_RADIUS >= paddleBottom &&
            ball.y - BALL_RADIUS <= paddle2.y + PADDLE_HEIGHT &&
            ball.x >= paddle2.x - BALL_RADIUS &&
            ball.x <= paddle2.x + PADDLE_WIDTH + BALL_RADIUS) {

          // Bounce!
          ball.y = paddleBottom - BALL_RADIUS

          const hitPos = (ball.x - paddle2.x) / PADDLE_WIDTH
          const angle = (hitPos - 0.5) * Math.PI / 2.5
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)

          ball.dx = Math.sin(angle) * speed
          ball.dy = Math.cos(angle) * speed
        }
      }
    } else {
      // Ball follows the server
      if (ball.servingPlayer === 1) {
        ball.x = paddle1.x + PADDLE_WIDTH / 2
        ball.y = paddle1.y + PADDLE_HEIGHT + BALL_RADIUS + 5
      } else {
        ball.x = paddle2.x + PADDLE_WIDTH / 2
        ball.y = paddle2.y - BALL_RADIUS - 5
      }
    }

    draw(ctx)
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [draw, resetBall])

  // Touch controls
  const handleTouchStart = (e) => {
    e.preventDefault()
    if (gameStateRef.current === 'start') {
      startGame()
      return
    }
    if (ballRef.current.serving) {
      serveBall()
      return
    }

    const touch = e.touches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const touchX = touch.clientX - rect.left
    const scaleX = CANVAS_WIDTH / rect.width
    const newX = touchX * scaleX - PADDLE_WIDTH / 2
    paddle1Ref.current.x = Math.max(TABLE_LEFT, Math.min(TABLE_RIGHT - PADDLE_WIDTH, newX))
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const touchX = touch.clientX - rect.left
    const scaleX = CANVAS_WIDTH / rect.width
    const newX = touchX * scaleX - PADDLE_WIDTH / 2
    paddle1Ref.current.x = Math.max(TABLE_LEFT, Math.min(TABLE_RIGHT - PADDLE_WIDTH, newX))
  }

  const handleTouchEnd = () => {}

  // Keyboard controls
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
      if (e.key === ' ') {
        e.preventDefault()
        if (gameStateRef.current === 'start') {
          startGame()
        } else if (ballRef.current.serving) {
          serveBall()
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
  }, [startGame, serveBall])

  // Start game loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  const getWinner = () => {
    if (score.player1 >= 11) return 'You'
    if (score.player2 >= 11) return 'CPU'
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Table Tennis</h1>

      {displayState === 'start' && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center max-w-md">
          <p className="text-3xl font-bold mb-4">Table Tennis</p>
          <p className="text-gray-400 mb-2">First to 11 points wins!</p>
          <div className="text-left text-gray-300 text-sm mb-4 bg-gray-700 p-3 rounded">
            <p className="font-bold mb-2">How to Play:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You are the <span className="text-blue-400">BLUE paddle</span> (top)</li>
              <li>CPU is the <span className="text-red-400">RED paddle</span> (bottom)</li>
              <li>Press SPACE to serve the ball</li>
              <li>Use ← → or A/D to move your paddle</li>
              <li>On mobile: touch and drag to move</li>
            </ul>
          </div>
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            Start Game
          </button>
        </div>
      )}

      {displayState === 'won' && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
          <p className="text-3xl font-bold mb-2 text-yellow-400">{getWinner()} Win!</p>
          <p className="text-gray-400 mb-4">Final Score: {score.player1} - {score.player2}</p>
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            Play Again
          </button>
        </div>
      )}

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg shadow-lg border-2 border-gray-600"
          style={{ touchAction: 'none', maxWidth: '100%' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      <div className="mt-6 text-center text-gray-400">
        <p>← → or A/D to move | SPACE to serve</p>
        <p className="text-sm mt-1">On mobile: touch and drag</p>
      </div>
    </div>
  )
}
