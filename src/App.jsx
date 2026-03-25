import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import TicTacToe from './pages/TicTacToe'
import Snake from './pages/Snake'
import ConnectFour from './pages/ConnectFour'
import Pong from './pages/Pong'
import SimonSays from './pages/SimonSays'
import MemoryMatch from './pages/MemoryMatch'
import Chess from './pages/Chess'
import Checkers from './pages/Checkers'
import Sudoku from './pages/Sudoku'
import Tetris from './pages/Tetris'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/game/tictactoe" element={<TicTacToe />} />
        <Route path="/game/snake" element={<Snake />} />
        <Route path="/game/connectfour" element={<ConnectFour />} />
        <Route path="/game/pong" element={<Pong />} />
        <Route path="/game/simonsays" element={<SimonSays />} />
        <Route path="/game/memorymatch" element={<MemoryMatch />} />
        <Route path="/game/chess" element={<Chess />} />
        <Route path="/game/checkers" element={<Checkers />} />
        <Route path="/game/sudoku" element={<Sudoku />} />
        <Route path="/game/tetris" element={<Tetris />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
