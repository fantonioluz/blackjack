import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import Card from './Card'
import './Game.css'

function Game({ roomCode, playerName, onLeave }) {
  const { socket } = useSocket()
  const [gameState, setGameState] = useState(null)
  const [players, setPlayers] = useState([])
  const [waitingForStart, setWaitingForStart] = useState(true)

  useEffect(() => {
    if (!socket) return

    // Listeners para eventos do jogo
    socket.on('player_joined', (data) => {
      console.log('Jogador entrou:', data)
      setPlayers(data.players)
    })

    socket.on('game_started', (state) => {
      console.log('Jogo iniciado:', state)
      setGameState(state)
      setWaitingForStart(false)
    })

    socket.on('game_update', (state) => {
      console.log('Atualização do jogo:', state)
      setGameState(state)
    })

    socket.on('player_left', (data) => {
      console.log('Jogador saiu:', data)
      setPlayers(data.players)
    })

    socket.on('player_disconnected', (data) => {
      console.log('Jogador desconectado:', data)
    })

    return () => {
      socket.off('player_joined')
      socket.off('game_started')
      socket.off('game_update')
      socket.off('player_left')
      socket.off('player_disconnected')
    }
  }, [socket])

  const handleStartGame = () => {
    socket.emit('start_game', { room_code: roomCode })
  }

  const handleHit = () => {
    socket.emit('player_action', { room_code: roomCode, action: 'hit' })
  }

  const handleStand = () => {
    socket.emit('player_action', { room_code: roomCode, action: 'stand' })
  }

  const handleNextRound = () => {
    socket.emit('next_round', { room_code: roomCode })
  }

  const handleLeave = () => {
    socket.emit('leave_room', { room_code: roomCode })
    onLeave()
  }

  const getCurrentPlayer = () => {
    if (!gameState || !gameState.current_player_sid) return null
    return gameState.players.find(p => p.sid === gameState.current_player_sid)
  }

  const isMyTurn = () => {
    const currentPlayer = getCurrentPlayer()
    return currentPlayer && currentPlayer.sid === socket.id
  }

  const canStartGame = () => {
    return waitingForStart && players.length >= 2
  }

  if (waitingForStart) {
    return (
      <div className="game-container">
        <div className="waiting-room">
          <h1>Sala: {roomCode}</h1>
          <p className="subtitle">Aguardando jogadores...</p>
          
          <div className="players-list">
            <h3>Jogadores ({players.length}/4):</h3>
            <ul>
              {players.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
          </div>

          {canStartGame() ? (
            <button className="start-button" onClick={handleStartGame}>
              Iniciar Jogo
            </button>
          ) : (
            <p className="info">Aguardando mais jogadores... (mínimo 2)</p>
          )}

          <button className="leave-button" onClick={handleLeave}>
            Sair da Sala
          </button>
        </div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="game-container">
        <p>Carregando jogo...</p>
      </div>
    )
  }

  const currentPlayer = getCurrentPlayer()
  const myTurn = isMyTurn()
  const gameFinished = gameState.game_phase === 'finished'

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="room-info">
          <h2>Sala: {roomCode}</h2>
          <button className="leave-button-small" onClick={handleLeave}>
            Sair
          </button>
        </div>
      </header>

      <main className="table-area">
        {/* Dealer */}
        <section className="dealer-section">
          <h3>Dealer</h3>
          <div className="dealer-hand">
            {gameState.dealer.hand.cards.map((card, index) => (
              <Card key={index} card={card} />
            ))}
          </div>
          <p className="hand-value">
            Total: {gameState.dealer.hand.value}
          </p>
        </section>

        {/* Status do Jogo */}
        <section className="game-status">
          {!gameFinished && currentPlayer && (
            <p className="turn-indicator">
              {myTurn ? (
                <strong>🎯 Sua vez!</strong>
              ) : (
                <span>Vez de: <strong>{currentPlayer.name}</strong></span>
              )}
            </p>
          )}
          {gameFinished && (
            <p className="round-finished">Rodada finalizada!</p>
          )}
        </section>

        {/* Jogadores */}
        <section className="players-section">
          {gameState.players.map((player) => {
            const isMe = player.sid === socket.id
            const isCurrent = player.is_current

            return (
              <div 
                key={player.sid} 
                className={`player-area ${isCurrent ? 'active' : ''} ${isMe ? 'me' : ''}`}
              >
                <h3>
                  {player.name} {isMe && '(Você)'}
                  <span className="wins">🏆 {player.wins}</span>
                </h3>
                
                <div className="player-hand">
                  {player.hand.cards.map((card, index) => (
                    <Card key={index} card={card} />
                  ))}
                </div>
                
                <p className="hand-value">
                  Total: {player.hand.value}
                </p>
                
                <p className={`player-status ${player.status}`}>
                  {player.status === 'bust' && '💥 Estourou!'}
                  {player.status === 'stand' && '✋ Parou'}
                  {player.status === 'playing' && '🎮 Jogando'}
                  {player.status === 'waiting' && '⏳ Aguardando'}
                </p>

                {isMe && isCurrent && !gameFinished && (
                  <div className="controls">
                    <button className="hit-button" onClick={handleHit}>
                      Pedir Carta
                    </button>
                    <button className="stand-button" onClick={handleStand}>
                      Manter Mão
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      </main>

      {/* Event Log */}
      <aside className="sidebar">
        <h3>Registro da Rodada</h3>
        <ul className="event-log">
          {gameState.event_log.map((event, index) => (
            <li key={index}>{event}</li>
          ))}
        </ul>

        {gameFinished && (
          <button className="next-round-button" onClick={handleNextRound}>
            Próxima Rodada
          </button>
        )}
      </aside>
    </div>
  )
}

export default Game
