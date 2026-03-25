import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const SIZE = 9
const BOX_SIZE = 3

function generateSudoku() {
  const solution = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0))

  const isValid = (grid, row, col, num) => {
    for (let i = 0; i < SIZE; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false
    }
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE
    for (let i = 0; i < BOX_SIZE; i++) {
      for (let j = 0; j < BOX_SIZE; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false
      }
    }
    return true
  }

  const solve = (grid) => {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (grid[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
          for (const num of nums) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num
              if (solve(grid)) return true
              grid[row][col] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }

  solve(solution)

  const puzzle = solution.map(row => [...row])
  const difficulty = 40
  let removed = 0
  const positions = []
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      positions.push([r, c])
  positions.sort(() => Math.random() - 0.5)

  for (const [r, c] of positions) {
    if (removed >= difficulty) break
    puzzle[r][c] = 0
    removed++
  }

  return { puzzle, solution }
}

function Sudoku() {
  const [puzzle, setPuzzle] = useState(null)
  const [solution, setSolution] = useState(null)
  const [board, setBoard] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [errorCells, setErrorCells] = useState(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState('medium')
  const [timer, setTimer] = useState(0)
  const [highScores, setHighScores] = useState(() => {
    try {
      const saved = localStorage.getItem('sudokuHighScores')
      return saved ? JSON.parse(saved) : { easy: null, medium: null, hard: null }
    } catch {
      return { easy: null, medium: null, hard: null }
    }
  })

  const timerRef = useRef(null)
  const selectedNumberRef = useRef(selectedNumber)
  const selectedCellRef = useRef(selectedCell)

  useEffect(() => {
    selectedNumberRef.current = selectedNumber
  }, [selectedNumber])

  useEffect(() => {
    selectedCellRef.current = selectedCell
  }, [selectedCell])

  useEffect(() => {
    if (isPlaying && !isComplete) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, isComplete])

  const checkComplete = useCallback((newBoard) => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (newBoard[r][c] === 0) return false
      }
    }
    return true
  }, [])

  const validateBoard = useCallback((newBoard) => {
    const errors = new Set()

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const num = newBoard[r][c]
        if (num === 0) continue

        // Check row
        for (let i = 0; i < SIZE; i++) {
          if (i !== c && newBoard[r][i] === num) {
            errors.add(`${r}-${c}`)
            errors.add(`${r}-${i}`)
          }
        }

        // Check column
        for (let i = 0; i < SIZE; i++) {
          if (i !== r && newBoard[i][c] === num) {
            errors.add(`${r}-${c}`)
            errors.add(`${i}-${c}`)
          }
        }

        // Check box
        const boxRow = Math.floor(r / BOX_SIZE) * BOX_SIZE
        const boxCol = Math.floor(c / BOX_SIZE) * BOX_SIZE
        for (let i = 0; i < BOX_SIZE; i++) {
          for (let j = 0; j < BOX_SIZE; j++) {
            const nr = boxRow + i
            const nc = boxCol + j
            if ((nr !== r || nc !== c) && newBoard[nr][nc] === num) {
              errors.add(`${r}-${c}`)
              errors.add(`${nr}-${nc}`)
            }
          }
        }
      }
    }

    return errors
  }, [])

  const fillSelectedCell = useCallback((num) => {
    const cell = selectedCellRef.current
    const number = selectedNumberRef.current

    if (!cell || !board || !puzzle) return

    const { row, col } = cell
    if (puzzle[row][col] !== 0) return

    const newBoard = board.map(r => [...r])
    newBoard[row][col] = num
    setBoard(newBoard)

    const errors = validateBoard(newBoard)
    setErrorCells(errors)

    if (checkComplete(newBoard) && errors.size === 0) {
      setIsComplete(true)
      setIsPlaying(false)

      const diff = difficulty
      if (!highScores[diff] || timer < highScores[diff]) {
        const newScores = { ...highScores, [diff]: timer }
        setHighScores(newScores)
        localStorage.setItem('sudokuHighScores', JSON.stringify(newScores))
      }
    }
  }, [board, puzzle, validateBoard, checkComplete, difficulty, timer, highScores])

  const handleCellClick = (row, col) => {
    if (!isPlaying || !board || !puzzle) return

    const isFixed = puzzle[row][col] !== 0

    // If clicking on a non-fixed cell with a selected number, fill it
    if (!isFixed && selectedNumberRef.current !== null && selectedNumberRef.current > 0) {
      setSelectedCell({ row, col })
      fillSelectedCell(selectedNumberRef.current)
      return
    }

    // Otherwise just select the cell
    setSelectedCell({ row, col })
  }

  const handleNumberClick = (num) => {
    if (!isPlaying) return

    setSelectedNumber(num)

    // If a cell is selected, fill it
    const cell = selectedCellRef.current
    if (cell && puzzle && puzzle[cell.row][cell.col] === 0) {
      fillSelectedCell(num)
    }
  }

  const startGame = (diff) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    setDifficulty(diff)
    const { puzzle: puz, solution: sol } = generateSudoku()
    setPuzzle(puz)
    setSolution(sol)
    setBoard(puz.map(r => [...r]))
    setSelectedCell(null)
    setSelectedNumber(null)
    setIsComplete(false)
    setErrorCells(new Set())
    setTimer(0)
    setIsPlaying(true)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderCell = (row, col) => {
    if (!board) return null

    const cellValue = board[row][col]
    const isFixed = puzzle && puzzle[row][col] !== 0
    const isSelected = selectedCell?.row === row && selectedCell?.col === col
    const hasError = errorCells.has(`${row}-${col}`)
    const isRelatedRow = selectedCell && selectedCell.row === row
    const isRelatedCol = selectedCell && selectedCell.col === col
    const isRelatedBox = selectedCell &&
      Math.floor(selectedCell.row / BOX_SIZE) === Math.floor(row / BOX_SIZE) &&
      Math.floor(selectedCell.col / BOX_SIZE) === Math.floor(col / BOX_SIZE)
    const isSameNumber = selectedNumber && cellValue === selectedNumber && selectedNumber > 0

    const borderRight = (col + 1) % BOX_SIZE === 0 && col < SIZE - 1
    const borderBottom = (row + 1) % BOX_SIZE === 0 && row < SIZE - 1

    let bgColor = 'bg-white'
    if (hasError) {
      bgColor = 'bg-red-400'
    } else if (isSelected) {
      bgColor = 'bg-blue-500'
    } else if (isSameNumber) {
      bgColor = 'bg-blue-300'
    } else if (isRelatedRow || isRelatedCol || isRelatedBox) {
      bgColor = 'bg-gray-200'
    }

    return (
      <div
        key={`${row}-${col}`}
        onClick={() => handleCellClick(row, col)}
        className={`
          w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center cursor-pointer
          text-lg sm:text-xl font-bold transition-colors select-none
          border-r ${borderRight ? 'border-amber-800' : 'border-gray-300'}
          border-b ${borderBottom ? 'border-amber-800' : 'border-gray-300'}
          ${bgColor}
          ${isFixed ? 'text-gray-900 font-bold' : 'text-blue-600'}
        `}
      >
        {cellValue || ''}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-2 sm:p-4 lg:p-8 flex flex-col items-center">
      <Link to="/" className="self-start text-gray-400 hover:text-white mb-2 sm:mb-4">
        ← Back
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Sudoku</h1>

      {!isPlaying ? (
        <div className="flex flex-col items-center gap-4 mt-4 sm:mt-8">
          {isComplete && (
            <p className="text-green-400 text-xl mb-2">
              Completed in {formatTime(timer)}!
            </p>
          )}
          <p className="text-gray-400 mb-2">Select difficulty:</p>
          <div className="flex gap-4 flex-wrap justify-center">
            {['easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => startGame(diff)}
                className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-semibold transition-colors capitalize"
              >
                {diff} {highScores[diff] && `(${formatTime(highScores[diff])})`}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-lg font-semibold">Time: {formatTime(timer)}</span>
            <span className="text-gray-400 capitalize">{difficulty}</span>
          </div>

          {isComplete && (
            <div className="mb-4 bg-green-600 px-6 py-3 rounded-lg">
              <p className="text-xl font-bold">Congratulations!</p>
              <p>Completed in {formatTime(timer)}</p>
            </div>
          )}

          <div className="border-4 border-amber-800 rounded-lg overflow-hidden shadow-xl">
            {board && board.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-gray-400 text-sm">Select a number:</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={`
                    w-10 h-10 rounded-lg font-bold text-lg transition-colors
                    ${selectedNumber === num ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}
                  `}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleNumberClick(0)}
                className={`
                  w-10 h-10 rounded-lg font-bold text-lg transition-colors
                  ${selectedNumber === 0 ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}
                `}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => startGame(difficulty)}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              New Game
            </button>
            <button
              onClick={() => setIsPlaying(false)}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Menu
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Sudoku
