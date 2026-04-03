import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const CELL_SIZE = 20
const MAZE_TEMPLATE = [
  '#####################',
  '#...................#',
  '#.###.#######.###.#.#',
  '#.#.............#...#',
  '#.#.###.#####.#.###.#',
  '#...#.#.....#.#.....#',
  '###.#.#.###.#.#.###.#',
  '#...#.#.#P#.#.#...#.#',
  '#.###.#.#.#.#.#.###.#',
  '#.....#...#.....#...#',
  '#.#########.#####.#.#',
  '#.#.....#.....#...#.#',
  '#.#.###.#####.###.#.#',
  '#.#.....D.....#.....#',
  '#.#######.#########.#',
  '#...................#',
  '#.#################.#',
  '#...................#',
  '#.#################.#',
  '#...................#',
  '#####################'
]

function createMaze() {
  return MAZE_TEMPLATE.map(row =>
    row.split('').map(char => ({
      isWall: char === '#',
      isDot: char === '.',
      isPower: char === 'D',
      isEmpty: char === ' '
    }))
  )
}

function findPacmanStart(maze) {
  for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[r].length; c++) {
      if (MAZE_TEMPLATE[r][c] === 'P') {
        return { row: r, col: c }
      }
    }
  }
  return { row: 7, col: 6 }
}

const GHOST_COLORS = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852']
const GHOST_NAMES = ['Blinky', 'Pinky', 'Inky', 'Clyde']

function PacMan() {
  const [maze, setMaze] = useState([])
  const [pacman, setPacman] = useState({ row: 7, col: 6, dir: 'right', nextDir: 'right' })
  const [ghosts, setGhosts] = useState([])
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('pacman_best')
    return saved ? parseInt(saved) : 0
  })
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState('start')
  const [powerMode, setPowerMode] = useState(false)
  const [powerTimer, setPowerTimer] = useState(0)
  const [dotsRemaining, setDotsRemaining] = useState(0)

  const mazeRef = useRef([])
  const pacmanRef = useRef({ row: 7, col: 6, dir: 'right', nextDir: 'right' })
  const ghostsRef = useRef([])
  const powerModeRef = useRef(false)
  const powerTimerRef = useRef(0)
  const gameStateRef = useRef('start')
  const animationRef = useRef(null)
  const lastTimeRef = useRef(0)
  const moveCounterRef = useRef(0)

  useEffect(() => { pacmanRef.current = pacman }, [pacman])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  const initGame = useCallback(() => {
    const newMaze = createMaze()
    mazeRef.current = newMaze
    setMaze([...newMaze])

    const startPos = findPacmanStart(newMaze)
    const initPac = { ...startPos, dir: 'right', nextDir: 'right' }
    setPacman(initPac)
    pacmanRef.current = initPac

    // Count dots
    let dotCount = 0
    newMaze.forEach(row => row.forEach(cell => {
      if (cell.isDot) dotCount++
      if (cell.isPower) dotCount++
    }))
    setDotsRemaining(dotCount)

    // Ghost house center
    const ghostHouseRow = 9
    const ghostHouseCol = 10

    // Initialize ghosts - start them inside the ghost house
    const initGhosts = [
      { row: ghostHouseRow, col: ghostHouseCol - 1, dir: 'up', color: GHOST_COLORS[0], scared: false, released: false },
      { row: ghostHouseRow, col: ghostHouseCol, dir: 'up', color: GHOST_COLORS[1], scared: false, released: false },
      { row: ghostHouseRow, col: ghostHouseCol + 1, dir: 'up', color: GHOST_COLORS[2], scared: false, released: false },
      { row: ghostHouseRow, col: ghostHouseCol, dir: 'up', color: GHOST_COLORS[3], scared: false, released: false }
    ]
    setGhosts([...initGhosts])
    ghostsRef.current = initGhosts

    setScore(0)
    setLives(3)
    setPowerMode(false)
    powerModeRef.current = false
    setPowerTimer(0)
    powerTimerRef.current = 0
    moveCounterRef.current = 0
  }, [])

  const startGame = useCallback(() => {
    initGame()
    setGameState('playing')
    gameStateRef.current = 'playing'
  }, [initGame])

  const canMove = useCallback((row, col) => {
    const maze = mazeRef.current
    if (row < 0 || row >= maze.length || col < 0 || col >= maze[0].length) return false
    return !maze[row][col].isWall
  }, [])

  const getNextPos = (row, col, dir) => {
    switch (dir) {
      case 'up': return { row: row - 1, col }
      case 'down': return { row: row + 1, col }
      case 'left': return { row, col: col - 1 }
      case 'right': return { row, col: col + 1 }
      default: return { row, col }
    }
  }

  const moveGhost = useCallback((ghost, idx) => {
    const pacman = pacmanRef.current
    const { row, col, dir, released } = ghost

    // Release ghosts gradually
    if (!released) {
      if (idx === 0 && moveCounterRef.current > 5) {
        // First ghost releases quickly
        ghost.released = true
      } else if (idx > 0 && moveCounterRef.current > 10 + idx * 15) {
        ghost.released = true
      }
      if (!ghost.released) {
        // Stay in ghost house, move up/down slowly
        const next = getNextPos(row, col, ghost.stuckDir || 'up')
        if (canMove(next.row, next.col)) {
          return { ...ghost, row: next.row, col: next.col, stuckDir: ghost.stuckDir }
        } else {
          return { ...ghost, stuckDir: ghost.stuckDir === 'up' ? 'down' : 'up' }
        }
      }
    }

    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' }
    const allDirs = ['up', 'down', 'left', 'right']
    let possibleDirs = allDirs.filter(d => d !== opposites[dir])

    // Filter to only valid directions
    possibleDirs = possibleDirs.filter(d => {
      const next = getNextPos(row, col, d)
      return canMove(next.row, next.col)
    })

    if (possibleDirs.length === 0) {
      // Dead end
      const opposite = opposites[dir]
      const next = getNextPos(row, col, opposite)
      if (canMove(next.row, next.col)) {
        possibleDirs = [opposite]
      } else {
        return ghost
      }
    }

    let chosenDir

    if (powerModeRef.current) {
      // Run away from Pac-Man - choose direction furthest from Pac-Man
      chosenDir = possibleDirs.reduce((best, d) => {
        const next = getNextPos(row, col, d)
        const dist = Math.abs(next.row - pacman.row) + Math.abs(next.col - pacman.col)
        const bestNext = getNextPos(row, col, best)
        const bestDist = Math.abs(bestNext.row - pacman.row) + Math.abs(bestNext.col - pacman.col)
        return dist > bestDist ? d : best
      })
    } else {
      // Chase Pac-Man with different strategies
      if (idx === 0) {
        // Red ghost - direct chase
        chosenDir = possibleDirs.reduce((best, d) => {
          const next = getNextPos(row, col, d)
          const dist = Math.abs(next.row - pacman.row) + Math.abs(next.col - pacman.col)
          const bestNext = getNextPos(row, col, best)
          const bestDist = Math.abs(bestNext.row - pacman.row) + Math.abs(bestNext.col - pacman.col)
          return dist < bestDist ? d : best
        })
      } else if (idx === 1) {
        // Pink ghost - target 4 tiles ahead of Pac-Man
        const targetRow = pacman.row + (pacman.dir === 'up' ? -4 : pacman.dir === 'down' ? 4 : 0)
        const targetCol = pacman.col + (pacman.dir === 'left' ? -4 : pacman.dir === 'right' ? 4 : 0)
        chosenDir = possibleDirs.reduce((best, d) => {
          const next = getNextPos(row, col, d)
          const dist = Math.abs(next.row - targetRow) + Math.abs(next.col - targetCol)
          const bestNext = getNextPos(row, col, best)
          const bestDist = Math.abs(bestNext.row - targetRow) + Math.abs(bestNext.col - targetCol)
          return dist < bestDist ? d : best
        })
      } else if (idx === 2) {
        // Cyan ghost - ambush from behind
        const behindRow = pacman.row - (pacman.dir === 'up' ? -4 : pacman.dir === 'down' ? 4 : 0)
        const behindCol = pacman.col - (pacman.dir === 'left' ? -4 : pacman.dir === 'right' ? 4 : 0)
        chosenDir = possibleDirs.reduce((best, d) => {
          const next = getNextPos(row, col, d)
          const dist = Math.abs(next.row - behindRow) + Math.abs(next.col - behindCol)
          const bestNext = getNextPos(row, col, best)
          const bestDist = Math.abs(bestNext.row - behindRow) + Math.abs(bestNext.col - behindCol)
          return dist < bestDist ? d : best
        })
      } else {
        // Orange ghost - random movement, chase when far
        const distToPac = Math.abs(row - pacman.row) + Math.abs(col - pacman.col)
        if (distToPac > 8) {
          chosenDir = possibleDirs.reduce((best, d) => {
            const next = getNextPos(row, col, d)
            const dist = Math.abs(next.row - pacman.row) + Math.abs(next.col - pacman.col)
            const bestNext = getNextPos(row, col, best)
            const bestDist = Math.abs(bestNext.row - pacman.row) + Math.abs(bestNext.col - pacman.col)
            return dist < bestDist ? d : best
          })
        } else {
          chosenDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)]
        }
      }
    }

    const next = getNextPos(row, col, chosenDir)
    return { ...ghost, row: next.row, col: next.col, dir: chosenDir }
  }, [canMove])

  const gameLoop = useCallback((timestamp) => {
    if (gameStateRef.current !== 'playing') return

    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const deltaTime = (timestamp - lastTimeRef.current) / 1000
    lastTimeRef.current = timestamp

    // Skip if deltaTime is too small (prevent first frame issues)
    if (deltaTime < 0.01) {
      animationRef.current = requestAnimationFrame(gameLoop)
      return
    }

    const pacman = pacmanRef.current
    let newPacman = { ...pacman }

    // Try to change direction
    if (pacman.nextDir) {
      const nextPos = getNextPos(pacman.row, pacman.col, pacman.nextDir)
      if (canMove(nextPos.row, nextPos.col)) {
        newPacman.dir = pacman.nextDir
      }
    }

    // Try to move in current direction
    const currentNext = getNextPos(newPacman.row, newPacman.col, newPacman.dir)
    if (canMove(currentNext.row, currentNext.col)) {
      newPacman.row = currentNext.row
      newPacman.col = currentNext.col
    }

    // Check dot eating
    const maze = mazeRef.current
    if (maze[newPacman.row] && maze[newPacman.row][newPacman.col]) {
      if (maze[newPacman.row][newPacman.col].isDot) {
        maze[newPacman.row][newPacman.col] = { ...maze[newPacman.row][newPacman.col], isDot: false }
        setMaze([...maze])
        setScore(s => s + 10)
        setDotsRemaining(d => d - 1)
      }

      if (maze[newPacman.row][newPacman.col].isPower) {
        maze[newPacman.row][newPacman.col] = { ...maze[newPacman.row][newPacman.col], isPower: false }
        setMaze([...maze])
        setScore(s => s + 50)
        setDotsRemaining(d => d - 1)
        setPowerMode(true)
        powerModeRef.current = true
        setPowerTimer(180)
        powerTimerRef.current = 180
      }
    }

    // Power mode timer
    if (powerModeRef.current) {
      powerTimerRef.current -= 1
      setPowerTimer(powerTimerRef.current)
      if (powerTimerRef.current <= 0) {
        setPowerMode(false)
        powerModeRef.current = false
      }
    }

    setPacman(newPacman)
    pacmanRef.current = newPacman

    // Move counter for releasing ghosts
    moveCounterRef.current += 1

    // Move ghosts (every 2 frames to make them slower than Pac-Man)
    if (moveCounterRef.current % 2 === 0) {
      let newGhosts = ghostsRef.current.map((ghost, idx) => moveGhost(ghost, idx))

      // Collision check after ghost movement
      let collision = false
      for (const ghost of newGhosts) {
        if (!ghost.released) continue
        const dist = Math.abs(newPacman.row - ghost.row) + Math.abs(newPacman.col - ghost.col)
        if (dist < 0.5) {
          collision = true
          if (powerModeRef.current && ghost.scared) {
            // Eat ghost
            setScore(s => s + 200)
            ghost.row = 9
            ghost.col = 10
            ghost.scared = false
          } else if (!ghost.scared) {
            // Pac-Man dies
            break
          }
        }
      }

      if (collision && !powerModeRef.current) {
        // Pac-Man caught by normal ghost
        const newLives = lives - 1
        setLives(newLives)

        if (newLives <= 0) {
          setGameState('gameover')
          gameStateRef.current = 'gameover'
          if (score > bestScore) {
            setBestScore(score)
            localStorage.setItem('pacman_best', score.toString())
          }
          animationRef.current = requestAnimationFrame(gameLoop)
          return
        }

        // Reset positions but keep score and lives
        const startPos = findPacmanStart(mazeRef.current)
        const resetPac = { ...startPos, dir: 'right', nextDir: 'right' }
        setPacman(resetPac)
        pacmanRef.current = resetPac

        // Reset ghosts to ghost house
        const ghostHouseRow = 9
        const ghostHouseCol = 10
        newGhosts = [
          { row: ghostHouseRow, col: ghostHouseCol - 1, dir: 'up', color: GHOST_COLORS[0], scared: false, released: false },
          { row: ghostHouseRow, col: ghostHouseCol, dir: 'up', color: GHOST_COLORS[1], scared: false, released: false },
          { row: ghostHouseRow, col: ghostHouseCol + 1, dir: 'up', color: GHOST_COLORS[2], scared: false, released: false },
          { row: ghostHouseRow, col: ghostHouseCol, dir: 'up', color: GHOST_COLORS[3], scared: false, released: false }
        ]
        moveCounterRef.current = 0
        setPowerMode(false)
        powerModeRef.current = false
      }

      // Set scared state for power mode
      newGhosts = newGhosts.map(g => ({
        ...g,
        scared: powerModeRef.current && g.released
      }))

      setGhosts([...newGhosts])
      ghostsRef.current = newGhosts
    }

    // Check win condition
    if (dotsRemaining <= 0) {
      setGameState('won')
      gameStateRef.current = 'won'
      if (score > bestScore) {
        setBestScore(score)
        localStorage.setItem('pacman_best', score.toString())
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, lives, score, bestScore, dotsRemaining, canMove, moveGhost])

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = 0
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, gameLoop])

  const handleKeyDown = useCallback((e) => {
    if (gameStateRef.current !== 'playing') return

    const dirMap = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      w: 'up', W: 'up',
      s: 'down', S: 'down',
      a: 'left', A: 'left',
      d: 'right', D: 'right'
    }

    if (dirMap[e.key]) {
      e.preventDefault()
      pacmanRef.current.nextDir = dirMap[e.key]
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const canvasWidth = MAZE_TEMPLATE[0].length * CELL_SIZE
  const canvasHeight = MAZE_TEMPLATE.length * CELL_SIZE

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-4">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-4">Pac-Man</h1>

      {/* Score Display */}
      <div className="flex gap-8 mb-4">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Score</p>
          <p className="text-2xl font-bold text-yellow-400">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Best</p>
          <p className="text-2xl font-bold text-green-400">{bestScore}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Lives</p>
          <p className="text-2xl font-bold text-red-400">{'🟡'.repeat(lives)}</p>
        </div>
      </div>

      {powerMode && (
        <div className="bg-blue-600 px-4 py-2 rounded-lg mb-4 animate-pulse">
          <p className="font-bold">Power Mode: {Math.ceil(powerTimer / 60)}s</p>
        </div>
      )}

      {gameState === 'start' && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
          <p className="text-3xl font-bold mb-4">Pac-Man</p>
          <p className="text-gray-400 mb-2">Eat all dots to win!</p>
          <p className="text-gray-400 text-sm mb-4">Use Arrow keys or WASD to move</p>
          <button
            onClick={startGame}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="bg-red-800 rounded-xl p-6 mb-6 text-center">
          <p className="text-3xl font-bold mb-2">Game Over!</p>
          <p className="text-2xl mb-4">Score: {score}</p>
          <button
            onClick={startGame}
            className="bg-red-600 hover:bg-red-500 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {gameState === 'won' && (
        <div className="bg-green-800 rounded-xl p-6 mb-6 text-center">
          <p className="text-3xl font-bold mb-2">You Win!</p>
          <p className="text-2xl mb-4">Score: {score}</p>
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Game Canvas */}
      <div
        className="relative bg-black rounded-lg overflow-hidden border-4 border-blue-900"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        {maze.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="absolute"
              style={{
                left: colIndex * CELL_SIZE,
                top: rowIndex * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE
              }}
            >
              {cell.isWall && (
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: '#1a1a8c' }}
                />
              )}
              {cell.isDot && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-300"
                />
              )}
              {cell.isPower && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-yellow-300 animate-pulse"
                />
              )}
            </div>
          ))
        ))}

        {/* Pac-Man */}
        {gameState === 'playing' && (
          <div
            className="absolute"
            style={{
              left: pacman.col * CELL_SIZE,
              top: pacman.row * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE
            }}
          >
            <div
              className="w-full h-full bg-yellow-400 rounded-full"
              style={{
                clipPath: pacman.dir === 'right' ? 'polygon(0 0, 100% 50%, 0 100%)' :
                         pacman.dir === 'left' ? 'polygon(100% 0, 0% 50%, 100% 100%)' :
                         pacman.dir === 'up' ? 'polygon(0 0, 50% 100%, 100% 0)' :
                         'polygon(0 100%, 50% 0, 100% 100%)'
              }}
            />
          </div>
        )}

        {/* Ghosts */}
        {gameState === 'playing' && ghosts.map((ghost, idx) => (
          <div
            key={idx}
            className="absolute"
            style={{
              left: ghost.col * CELL_SIZE,
              top: ghost.row * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              opacity: ghost.released ? 1 : 0.5
            }}
          >
            <svg viewBox="0 0 20 20" className="w-full h-full">
              <path
                d="M2 10 L2 18 L5 15 L8 18 L11 15 L14 18 L17 15 L17 10 Q17 2 10 2 Q3 2 3 10 Z"
                fill={ghost.scared ? '#0000ff' : ghost.color}
              />
              <circle cx="6" cy="7" r="2" fill="white" />
              <circle cx="14" cy="7" r="2" fill="white" />
              {ghost.scared && (
                <>
                  <rect x="4" y="11" width="3" height="2" fill="white" />
                  <rect x="8" y="11" width="3" height="2" fill="white" />
                  <rect x="13" y="11" width="3" height="2" fill="white" />
                </>
              )}
            </svg>
          </div>
        ))}
      </div>

      {/* Controls Info */}
      <div className="mt-6 text-center text-gray-400">
        <p>Arrow keys or WASD to move</p>
        <p className="text-sm mt-1">Eat all yellow dots to win!</p>
      </div>
    </div>
  )
}

export default PacMan
