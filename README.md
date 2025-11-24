# 🃏 Blackjack Multiplayer

Jogo de Blackjack multiplayer em tempo real com backend em Python (FastAPI + WebSockets) e frontend em React.

## 🚀 Quick Start

### Com Docker (Recomendado)

```bash
docker-compose up --build
```

Acesse: http://localhost

### Desenvolvimento Local

**Backend:**
```bash
cd backend
pip install uv
uv pip install --system -r pyproject.toml
uv run uvicorn main:socket_app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📦 Stack

- **Backend**: Python 3.14, FastAPI 0.115, Socket.IO 5.15, Uvicorn 0.38, uv
- **Frontend**: React 18.3, Vite 6, Socket.IO Client 4.8, Node 24
- **Deploy**: Docker, Nginx

## 🎮 Como Jogar

1. Crie uma sala ou entre com o código
2. Aguarde pelo menos 2 jogadores
3. Primeiro jogador inicia o jogo
4. Na sua vez: **Pedir Carta** (Hit) ou **Manter Mão** (Stand)
5. Objetivo: chegar o mais próximo de 21 sem estourar

## 🏗️ Estrutura

```
blackjack/
├── backend/           # FastAPI + Socket.IO
│   ├── main.py       # Servidor
│   ├── game_logic.py # Lógica do jogo
│   └── Dockerfile
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── components/
│   │   └── context/
│   └── Dockerfile
└── docker-compose.yml
```

## 📡 API WebSocket

### Eventos Cliente → Servidor
- `create_room` - Criar sala
- `join_room` - Entrar em sala
- `start_game` - Iniciar jogo
- `player_action` - Hit/Stand
- `next_round` - Próxima rodada

### Eventos Servidor → Cliente
- `game_started` - Jogo iniciado
- `game_update` - Estado atualizado
- `player_joined` - Jogador entrou

## 🐳 Deploy

```bash
# Produção
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## 📝 Variáveis de Ambiente

**Frontend (.env):**
```env
VITE_SOCKET_URL=http://localhost:8000
```

---

**Desenvolvido com Python 3.14, FastAPI, React 18.3 e Socket.IO**