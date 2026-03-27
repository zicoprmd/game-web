import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 500
const PLAYER_WIDTH = 50
const PLAYER_HEIGHT = 20
const BULLET_WIDTH = 4
const BULLET_HEIGHT = 12
const ENEMY_WIDTH = 35
const ENEMY_HEIGHT = 25
const ENEMY_ROWS = 4
const ENEMY_COLS = 8
const ENEMY_PADDING = 15

const PLAYER_SPEED = 300
const BULLET_SPEED = 400
const ENEMY_BULLET_SPEED = 200
const ENEMY_SPEED = 30

export default function SpaceInvaders() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)
  const playerRef = useRef({ x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2 })
  const bulletsRef = useRef([])
  const enemyBulletsRef = useRef([])
  const enemiesRef = useRef([])
  const gameStateRef = useRef('start')
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const enemyDirectionRef = useRef(1)
  const keysRef = useRef({ left: false, right: false, space: false })
  const canShootRef = useRef(true)

  const [displayState, setDisplayState] = useState('start')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('spaceinvaders_best_score')
    return saved ? parseInt(saved) : null
  })

  const initEnemies = useCallback(() => {
    const enemies = []
    const startX = (CANVAS_WIDTH - ENEMY_COLS * (ENEMY_WIDTH + ENEMY_PADDING)) / 2
    for (let r = 0; r < ENEMY_ROWS; r++) {
      for (let c = 0; c < ENEMY_COLS; c++) {
        enemies.push({
          x: startX + c * (ENEMY_WIDTH + ENEMY_PADDING),
          y: 60 + r * (ENEMY_HEIGHT + ENEMY_PADDING),
          alive: true,
        })
      }
    }
    return enemies
  }, [])

  const resetGame = useCallback(() => {
    playerRef.current.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2
    bulletsRef.current = []
    enemyBulletsRef.current = []
    enemiesRef.current = initEnemies()
    enemyDirectionRef.current = 1
    scoreRef.current = 0
    livesRef.current = 3
    setScore(0)
    setLives(3)
    gameStateRef.current = 'playing'
    setDisplayState('playing')
  }, [initEnemies])

  const startGame = useCallback(() => {
    playerRef.current.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2
    bulletsRef.current = []
    enemyBulletsRef.current = []
    enemiesRef.current = initEnemies()
    enemyDirectionRef.current = 1
    scoreRef.current = 0
    livesRef.current = 3
    setScore(0)
    setLives(3)
    gameStateRef.current = 'playing'
    setDisplayState('playing')
  }, [initEnemies])

  const draw = useCallback((ctx) => {
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = '#1a1a2e'
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.fillRect(i, 0, 2, CANVAS_HEIGHT)
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.fillRect(0, i, CANVAS_WIDTH, 2)
    }

    enemiesRef.current.forEach(enemy => {
      if (!enemy.alive) return
      ctx.fillStyle = '#00ff88'
      ctx.beginPath()
      ctx.moveTo(enemy.x + ENEMY_WIDTH / 2, enemy.y)
      ctx.lineTo(enemy.x + ENEMY_WIDTH, enemy.y + ENEMY_HEIGHT)
      ctx.lineTo(enemy.x, enemy.y + ENEMY_HEIGHT)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#ff4444'
      ctx.fillRect(enemy.x + 5, enemy.y + 5, 6, 6)
      ctx.fillRect(enemy.x + ENEMY_WIDTH - 11, enemy.y + 5, 6, 6)
    })

    ctx.fillStyle = '#63b3ed'
    ctx.fillRect(
      playerRef.current.x,
      CANVAS_HEIGHT - PLAYER_HEIGHT - 10,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    )
    ctx.fillStyle = '#3182ce'
    ctx.fillRect(
      playerRef.current.x + 10,
      CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      10,
      15
    )
    ctx.fillRect(
      playerRef.current.x + PLAYER_WIDTH - 20,
      CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      10,
      15
    )

    ctx.fillStyle = '#ffd700'
    bulletsRef.current.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT)
    })

    ctx.fillStyle = '#ff6b6b'
    enemyBulletsRef.current.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT)
    })
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

    const player = playerRef.current

    if (keysRef.current.left) {
      player.x -= PLAYER_SPEED * deltaTime
    }
    if (keysRef.current.right) {
      player.x += PLAYER_SPEED * deltaTime
    }
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, player.x))

    if (keysRef.current.space && canShootRef.current) {
      bulletsRef.current.push({
        x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: CANVAS_HEIGHT - PLAYER_HEIGHT - 22,
      })
      canShootRef.current = false
    }

    bulletsRef.current = bulletsRef.current.filter(bullet => {
      bullet.y -= BULLET_SPEED * deltaTime
      return bullet.y > -BULLET_HEIGHT
    })

    enemyBulletsRef.current = enemyBulletsRef.current.filter(bullet => {
      bullet.y += ENEMY_BULLET_SPEED * deltaTime
      return bullet.y < CANVAS_HEIGHT
    })

    const aliveEnemies = enemiesRef.current.filter(e => e.alive)
    if (aliveEnemies.length === 0) {
      gameStateRef.current = 'won'
      setDisplayState('won')
      if (scoreRef.current > (bestScore || 0)) {
        setBestScore(scoreRef.current)
        localStorage.setItem('spaceinvaders_best_score', scoreRef.current.toString())
      }
      draw(ctx)
      animationRef.current = requestAnimationFrame(gameLoop)
      return
    }

    let shouldDropAndReverse = false
    aliveEnemies.forEach(enemy => {
      enemy.x += ENEMY_SPEED * enemyDirectionRef.current * deltaTime
      if (enemy.x <= 10 || enemy.x >= CANVAS_WIDTH - ENEMY_WIDTH - 10) {
        shouldDropAndReverse = true
      }
    })

    if (shouldDropAndReverse) {
      enemyDirectionRef.current *= -1
      aliveEnemies.forEach(enemy => {
        enemy.y += 15
        if (enemy.y >= CANVAS_HEIGHT - PLAYER_HEIGHT - 40) {
          gameStateRef.current = 'lost'
          setDisplayState('lost')
          if (scoreRef.current > (bestScore || 0)) {
            setBestScore(scoreRef.current)
            localStorage.setItem('spaceinvaders_best_score', scoreRef.current.toString())
          }
        }
      })
    }

    bulletsRef.current.forEach(bullet => {
      enemiesRef.current.forEach(enemy => {
        if (!enemy.alive) return
        if (
          bullet.x < enemy.x + ENEMY_WIDTH &&
          bullet.x + BULLET_WIDTH > enemy.x &&
          bullet.y < enemy.y + ENEMY_HEIGHT &&
          bullet.y + BULLET_HEIGHT > enemy.y
        ) {
          enemy.alive = false
          bullet.y = -100
          scoreRef.current += 100
          setScore(scoreRef.current)
        }
      })
    })

    enemyBulletsRef.current.forEach(bullet => {
      if (
        bullet.x < player.x + PLAYER_WIDTH &&
        bullet.x + BULLET_WIDTH > player.x &&
        bullet.y + BULLET_HEIGHT > CANVAS_HEIGHT - PLAYER_HEIGHT - 10 &&
        bullet.y < CANVAS_HEIGHT - 10
      ) {
        bullet.y = CANVAS_HEIGHT + 100
        livesRef.current -= 1
        setLives(livesRef.current)

        if (livesRef.current <= 0) {
          gameStateRef.current = 'lost'
          setDisplayState('lost')
          if (scoreRef.current > (bestScore || 0)) {
            setBestScore(scoreRef.current)
            localStorage.setItem('spaceinvaders_best_score', scoreRef.current.toString())
          }
        }
      }
    })

    if (Math.random() < 0.01 && aliveEnemies.length > 0) {
      const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
      enemyBulletsRef.current.push({
        x: shooter.x + ENEMY_WIDTH / 2 - BULLET_WIDTH / 2,
        y: shooter.y + ENEMY_HEIGHT,
      })
    }

    draw(ctx)
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [draw, bestScore])

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
        keysRef.current.space = true
      }
    }

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false
      }
      if (e.key === ' ') {
        keysRef.current.space = false
        canShootRef.current = true
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
    enemiesRef.current = initEnemies()
    animationRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initEnemies, gameLoop])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Space Invaders</h1>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Score</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-2">
            <p className="text-gray-400 text-sm">Lives</p>
            <p className="text-2xl font-bold">{'🚀'.repeat(lives)}</p>
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
            <p className="text-3xl font-bold mb-4">Space Invaders</p>
            <p className="text-gray-400 mb-6">Arrow keys to move, Space to shoot</p>
            <button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-semibold transition-colors"
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
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-lg shadow-lg border-2 border-gray-700"
          />
        </div>

        <div className="mt-6 text-center text-gray-400">
          <p>← → or A/D to move, SPACE to shoot</p>
          <p className="text-sm mt-1">Destroy all enemies to win!</p>
        </div>
      </div>
    </div>
  )
}
