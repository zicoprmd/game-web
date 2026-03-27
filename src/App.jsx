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
import Game2048 from './pages/Game2048'
import SlidingPuzzle from './pages/SlidingPuzzle'
import Minesweeper from './pages/Minesweeper'
import Breakout from './pages/Breakout'
import SpaceInvaders from './pages/SpaceInvaders'
import FlappyBird from './pages/FlappyBird'
import TableTennis from './pages/TableTennis'
import Wordle from './pages/Wordle'
import Bejeweled from './pages/Bejeweled'
import JigsawPuzzle from './pages/JigsawPuzzle'
import PacMan from './pages/PacMan'

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
        <Route path="/game/2048" element={<Game2048 />} />
        <Route path="/game/slidingpuzzle" element={<SlidingPuzzle />} />
        <Route path="/game/minesweeper" element={<Minesweeper />} />
        <Route path="/game/breakout" element={<Breakout />} />
        <Route path="/game/spaceinvaders" element={<SpaceInvaders />} />
        <Route path="/game/flappybird" element={<FlappyBird />} />
        <Route path="/game/tabletennis" element={<TableTennis />} />
        <Route path="/game/wordle" element={<Wordle />} />
        <Route path="/game/bejeweled" element={<Bejeweled />} />
        <Route path="/game/jigsawpuzzle" element={<JigsawPuzzle />} />
        <Route path="/game/pacman" element={<PacMan />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
