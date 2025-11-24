import { useState } from 'react'
import Lobby from './components/Lobby'
import Game from './components/Game'
import { SocketProvider } from './context/SocketContext'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('lobby') // lobby, game
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')

  const handleJoinGame = (code, name) => {
    setRoomCode(code)
    setPlayerName(name)
    setGameState('game')
  }

  const handleLeaveGame = () => {
    setGameState('lobby')
    setRoomCode('')
  }

  return (
    <SocketProvider>
      <div className="app">
        {gameState === 'lobby' ? (
          <Lobby onJoinGame={handleJoinGame} />
        ) : (
          <Game 
            roomCode={roomCode} 
            playerName={playerName}
            onLeave={handleLeaveGame}
          />
        )}
      </div>
    </SocketProvider>
  )
}

export default App
