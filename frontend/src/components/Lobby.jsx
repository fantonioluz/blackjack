import { useState } from 'react'
import { useSocket } from '../context/SocketContext'
import './Lobby.css'

function Lobby({ onJoinGame }) {
  const { socket, connected } = useSocket()
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState('') // create, join
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Digite seu nome')
      return
    }

    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    setLoading(true)
    setError('')

    socket.emit('create_room', {
      room_code: newRoomCode,
      player_name: playerName.trim(),
      max_players: 4
    })

    socket.once('room_created', (response) => {
      setLoading(false)
      if (response.success) {
        onJoinGame(newRoomCode, playerName.trim())
      } else {
        setError(response.error || 'Erro ao criar sala')
      }
    })
  }

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Digite seu nome')
      return
    }
    if (!roomCode.trim()) {
      setError('Digite o código da sala')
      return
    }

    setLoading(true)
    setError('')

    socket.emit('join_room', {
      room_code: roomCode.trim().toUpperCase(),
      player_name: playerName.trim()
    })

    socket.once('join_result', (response) => {
      setLoading(false)
      if (response.success) {
        onJoinGame(roomCode.trim().toUpperCase(), playerName.trim())
      } else {
        setError(response.error || 'Erro ao entrar na sala')
      }
    })
  }

  if (!connected) {
    return (
      <div className="lobby">
        <div className="lobby-container">
          <h1>🃏 Blackjack Multiplayer</h1>
          <p className="connecting">Conectando ao servidor...</p>
        </div>
      </div>
    )
  }

  if (!mode) {
    return (
      <div className="lobby">
        <div className="lobby-container">
          <h1>🃏 Blackjack Multiplayer</h1>
          <p className="subtitle">Jogue Blackjack online com seus amigos</p>
          
          <div className="mode-selection">
            <button 
              className="mode-button create"
              onClick={() => setMode('create')}
            >
              <span className="icon">➕</span>
              <span>Criar Nova Sala</span>
            </button>
            
            <button 
              className="mode-button join"
              onClick={() => setMode('join')}
            >
              <span className="icon">🚪</span>
              <span>Entrar em Sala</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lobby">
      <div className="lobby-container">
        <button className="back-button" onClick={() => setMode('')}>
          ← Voltar
        </button>
        
        <h1>🃏 Blackjack Multiplayer</h1>
        <h2>{mode === 'create' ? 'Criar Nova Sala' : 'Entrar em Sala'}</h2>
        
        <div className="form">
          <div className="form-group">
            <label htmlFor="playerName">Seu nome:</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Digite seu nome"
              maxLength={20}
              disabled={loading}
            />
          </div>

          {mode === 'join' && (
            <div className="form-group">
              <label htmlFor="roomCode">Código da sala:</label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123"
                maxLength={6}
                disabled={loading}
              />
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <button
            className="action-button"
            onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : mode === 'create' ? 'Criar Sala' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Lobby
