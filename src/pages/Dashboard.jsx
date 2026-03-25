import { Link } from 'react-router-dom'

const gameCategories = [
  {
    category: 'Strategy',
    emoji: '♟️',
    games: [
      {
        id: 'chess',
        name: 'Chess',
        description: 'Classic turn-based strategy board game',
        emoji: '♔'
      },
      {
        id: 'checkers',
        name: 'Checkers',
        description: 'Classic jump and capture board game',
        emoji: '⭕'
      },
      {
        id: 'sudoku',
        name: 'Sudoku',
        description: 'Fill the grid with numbers 1-9',
        emoji: '🧩'
      }
    ]
  },
  {
    category: 'Classic',
    emoji: '🎮',
    games: [
      {
        id: 'tictactoe',
        name: 'Tic Tac Toe',
        description: 'Classic two-player game',
        emoji: '🎮'
      },
      {
        id: 'connectfour',
        name: 'Connect Four',
        description: 'Drop discs, connect four in a row!',
        emoji: '🔴'
      },
      {
        id: 'memorymatch',
        name: 'Memory Match',
        description: 'Find matching pairs of cards!',
        emoji: '🃏'
      }
    ]
  },
  {
    category: 'Arcade',
    emoji: '🕹️',
    games: [
      {
        id: 'snake',
        name: 'Snake',
        description: 'Eat and grow, avoid the walls!',
        emoji: '🐍'
      },
      {
        id: 'pong',
        name: 'Pong',
        description: 'Classic arcade paddle game!',
        emoji: '🏓'
      },
      {
        id: 'tetris',
        name: 'Tetris',
        description: 'Stack blocks and clear lines!',
        emoji: '🧱'
      }
    ]
  },
  {
    category: 'Memory',
    emoji: '🧠',
    games: [
      {
        id: 'simonsays',
        name: 'Simon Says',
        description: 'Memory pattern game - follow the sequence!',
        emoji: '🧠'
      }
    ]
  }
]

function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-12">Game Hub</h1>

      <div className="space-y-12 max-w-5xl mx-auto">
        {gameCategories.map((cat) => (
          <div key={cat.category}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">{cat.emoji}</span>
              {cat.category} Games
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.games.map((game) => (
                <Link
                  key={game.id}
                  to={`/game/${game.id}`}
                  className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-500"
                >
                  <span className="text-5xl mb-4 block">{game.emoji}</span>
                  <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
                  <p className="text-gray-400">{game.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
