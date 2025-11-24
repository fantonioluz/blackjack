"""
Backend do jogo Blackjack Multiplayer
FastAPI + Socket.IO para comunicação em tempo real
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from game_logic import GameManager

# Criar instância do Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Criar app FastAPI
app = FastAPI(title="Blackjack Multiplayer API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, substitua por ["https://seu-app.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gerenciador de jogos
game_manager = GameManager(sio)

# Combinar Socket.IO com FastAPI
socket_app = socketio.ASGIApp(sio, app)


@app.get("/")
async def root():
    return {"message": "Blackjack Multiplayer API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/rooms")
async def get_rooms():
    """Lista todas as salas disponíveis"""
    rooms = game_manager.get_rooms_info()
    return {"rooms": rooms}


# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    print(f"Cliente conectado: {sid}")
    await sio.emit('connected', {'sid': sid}, room=sid)


@sio.event
async def disconnect(sid):
    print(f"Cliente desconectado: {sid}")
    await game_manager.handle_disconnect(sid)


@sio.event
async def create_room(sid, data):
    """Cria uma nova sala de jogo"""
    room_code = data.get('room_code')
    player_name = data.get('player_name')
    max_players = data.get('max_players', 4)
    
    result = await game_manager.create_room(sid, room_code, player_name, max_players)
    
    if result['success']:
        # Adicionar socket à sala do Socket.IO
        await sio.enter_room(sid, room_code)
    
    await sio.emit('room_created', result, room=sid)


@sio.event
async def join_room(sid, data):
    """Entra em uma sala existente"""
    room_code = data.get('room_code')
    player_name = data.get('player_name')
    
    result = await game_manager.join_room(sid, room_code, player_name)
    
    if result['success']:
        # Adicionar socket à sala do Socket.IO
        await sio.enter_room(sid, room_code)
        
        # Notificar todos na sala
        await sio.emit('player_joined', {
            'player_name': player_name,
            'players': result['players']
        }, room=room_code)
    
    await sio.emit('join_result', result, room=sid)


@sio.event
async def start_game(sid, data):
    """Inicia o jogo na sala"""
    room_code = data.get('room_code')
    result = await game_manager.start_game(sid, room_code)
    
    if result['success']:
        # Notificar todos na sala
        await sio.emit('game_started', result['game_state'], room=room_code)


@sio.event
async def player_action(sid, data):
    """Processa ação do jogador (hit ou stand)"""
    room_code = data.get('room_code')
    action = data.get('action')  # 'hit' ou 'stand'
    
    result = await game_manager.handle_player_action(sid, room_code, action)
    
    if result['success']:
        # Atualizar todos na sala
        await sio.emit('game_update', result['game_state'], room=room_code)


@sio.event
async def next_round(sid, data):
    """Inicia próxima rodada"""
    room_code = data.get('room_code')
    result = await game_manager.next_round(sid, room_code)
    
    if result['success']:
        await sio.emit('game_started', result['game_state'], room=room_code)


@sio.event
async def leave_room(sid, data):
    """Sai da sala"""
    room_code = data.get('room_code')
    result = await game_manager.leave_room(sid, room_code)
    
    if result['success']:
        await sio.leave_room(sid, room_code)
        await sio.emit('player_left', result, room=room_code)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000, log_level="info")
