import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600
const BIRD_WIDTH = 40
const BIRD_HEIGHT = 30
const PIPE_WIDTH = 60
const PIPE_GAP = 180
const PIPE_SPEED = 150
const GRAVITY = 500
const FLAP_STRENGTH = -200

export default function FlappyBird() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)
  const birdRef = useRef({ x: 80, y: CANVAS_HEIGHT / 2, dy: 0 })
  const pipesRef = useRef([])
  const gameStateRef = useRef('start')
  const scoreRef = useRef(0)
  const bestScoreRef = useRef(0)

  useEffect(() => {
    const saved = localStorage.getItem('flappy_best_score')
    if (saved) bestScoreRef.current = parseInt(saved)
  }, [])

  const [displayState, setDisplayState] = useState('start')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('flappy_best_score')
    return saved ? parseInt(saved) : 0
  })

  const resetGame = useCallback(() => {
    birdRef.current = { x: 80, y: CANVAS_HEIGHT / 2, dy: 0 }
    pipesRef.current = []
    scoreRef.current = 0
    setScore(0)
    gameStateRef.current = 'playing'
    setDisplayState('playing')
  }, [])

  const startGame = useCallback(() => {
    birdRef.current = { x: 80, y: CANVAS_HEIGHT / 2, dy: 0 }
    pipesRef.current = []
    scoreRef.current = 0
    setScore(0)
    gameStateRef.current = 'playing'
    setDisplayState('playing')
    // Immediate flap on start
    birdRef.current.dy = FLAP_STRENGTH
  }, [])

  const drawBird = useCallback((ctx, bird) => {
    ctx.save()
    ctx.translate(bird.x + BIRD_WIDTH / 2, bird.y + BIRD_HEIGHT / 2)
    const angle = Math.min(Math.max(bird.dy * 0.003, -0.5), 1)
    ctx.rotate(angle)

    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.ellipse(0, 0, BIRD_WIDTH / 2, BIRD_HEIGHT / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ff6b00'
    ctx.beginPath()
    ctx.moveTo(BIRD_WIDTH / 2 - 5, 0)
    ctx.lineTo(BIRD_WIDTH / 2 + 8, -5)
    ctx.lineTo(BIRD_WIDTH / 2 + 8, 5)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(-5, -5, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(-3, -5, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ff6b00'
    ctx.beginPath()
    ctx.ellipse(-BIRD_WIDTH / 2 + 5, 5, 10, 5, 0.3, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }, [])

  const drawPipe = useCallback((ctx, pipe) => {
    const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0)
    gradient.addColorStop(0, '#38a169')
    gradient.addColorStop(0.5, '#48bb78')
    gradient.addColorStop(1, '#38a169')

    ctx.fillStyle = gradient
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)

    ctx.fillStyle = '#276749'
    ctx.fillRect(pipe.x, 0, 8, pipe.topHeight)

    ctx.fillStyle = '#276749'
    ctx.fillRect(pipe.x + PIPE_WIDTH - 8, 0, 8, pipe.topHeight)

    const capHeight = 20
    ctx.fillStyle = gradient
    ctx.fillRect(pipe.x - 5, pipe.topHeight - capHeight, PIPE_WIDTH + 10, capHeight)
    ctx.fillStyle = '#276749'
    ctx.fillRect(pipe.x - 5, pipe.topHeight - capHeight, 8, capHeight)
    ctx.fillRect(pipe.x + PIPE_WIDTH - 3, pipe.topHeight - capHeight, 8, capHeight)

    ctx.fillStyle = gradient
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY)

    ctx.fillStyle = '#276749'
    ctx.fillRect(pipe.x, pipe.bottomY, 8, CANVAS_HEIGHT - pipe.bottomY)
    ctx.fillRect(pipe.x + PIPE_WIDTH - 8, pipe.bottomY, 8, CANVAS_HEIGHT - pipe.bottomY)

    ctx.fillStyle = gradient
    ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 20)
    ctx.fillStyle = '#276749'
    ctx.fillRect(pipe.x - 5, pipe.bottomY, 8, 20)
    ctx.fillRect(pipe.x + PIPE_WIDTH - 3, pipe.bottomY, 8, 20)
  }, [])

  const draw = useCallback((ctx) => {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    skyGradient.addColorStop(0, '#1a1a2e')
    skyGradient.addColorStop(0.5, '#16213e')
    skyGradient.addColorStop(1, '#0f3460')
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    for (let i = 0; i < 50; i++) {
      const x = (i * 47) % CANVAS_WIDTH
      const y = (i * 31) % CANVAS_HEIGHT
      ctx.beginPath()
      ctx.arc(x, y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2)
      ctx.fill()
    }

    pipesRef.current.forEach(pipe => {
      drawPipe(ctx, pipe)
    })

    drawBird(ctx, birdRef.current)

    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(scoreRef.current, CANVAS_WIDTH / 2, 60)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Best: ${bestScoreRef.current}`, 15, 30)
  }, [drawBird, drawPipe])

  const flap = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      birdRef.current.dy = FLAP_STRENGTH
    }
  }, [])

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

    const bird = birdRef.current
    bird.dy += GRAVITY * deltaTime
    bird.y += bird.dy * deltaTime

    if (bird.y <= 0) {
      bird.y = 0
      bird.dy = 0
    }

    if (bird.y + BIRD_HEIGHT >= CANVAS_HEIGHT) {
      bird.y = CANVAS_HEIGHT - BIRD_HEIGHT
      gameStateRef.current = 'lost'
      setDisplayState('lost')
      if (scoreRef.current > bestScoreRef.current) {
        bestScoreRef.current = scoreRef.current
        setBestScore(scoreRef.current)
        localStorage.setItem('flappy_best_score', scoreRef.current.toString())
      }
      draw(ctx)
      animationRef.current = requestAnimationFrame(gameLoop)
      return
    }

    if (pipesRef.current.length === 0 || pipesRef.current[pipesRef.current.length - 1].x < CANVAS_WIDTH - 200) {
      const topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 150) + 80
      pipesRef.current.push({
        x: CANVAS_WIDTH,
        topHeight: topHeight,
        bottomY: topHeight + PIPE_GAP,
        passed: false,
      })
    }

    pipesRef.current.forEach(pipe => {
      pipe.x -= PIPE_SPEED * deltaTime
    })

    pipesRef.current = pipesRef.current.filter(pipe => pipe.x > -PIPE_WIDTH)

    pipesRef.current.forEach(pipe => {
      if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
        pipe.passed = true
        scoreRef.current += 1
        setScore(scoreRef.current)
      }
    })

    pipesRef.current.forEach(pipe => {
      if (
        bird.x + BIRD_WIDTH > pipe.x &&
        bird.x < pipe.x + PIPE_WIDTH &&
        (bird.y < pipe.topHeight || bird.y + BIRD_HEIGHT > pipe.bottomY)
      ) {
        gameStateRef.current = 'lost'
        setDisplayState('lost')
        if (scoreRef.current > bestScoreRef.current) {
          bestScoreRef.current = scoreRef.current
          setBestScore(scoreRef.current)
          localStorage.setItem('flappy_best_score', scoreRef.current.toString())
        }
      }
    })

    draw(ctx)
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [draw])

  useEffect(() => {
    const handleClick = () => {
      if (gameStateRef.current === 'start') {
        startGame()
      } else if (gameStateRef.current === 'playing') {
        flap()
      } else {
        resetGame()
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        handleClick()
      }
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('click', handleClick)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      if (canvas) {
        canvas.removeEventListener('click', handleClick)
      }
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [startGame, flap, resetGame])

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
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Flappy Bird</h1>
        </div>

        {displayState === 'start' && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-3xl font-bold mb-4">Flappy Bird</p>
            <p className="text-gray-400 mb-6">Click or press Space to flap</p>
            <button
              onClick={startGame}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {displayState === 'lost' && (
          <div className="bg-red-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-3xl font-bold mb-2">Game Over!</p>
            <p className="text-lg mb-2">Score: {score}</p>
            <p className="text-gray-400 mb-4">Best: {bestScore}</p>
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
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-lg shadow-lg border-2 border-gray-700 cursor-pointer"
          />
        </div>

        <div className="mt-6 text-center text-gray-400">
          <p>Click, Space, or Arrow Up to flap</p>
          <p className="text-sm mt-1">Avoid the pipes!</p>
        </div>
      </div>
    </div>
  )
}
