"""
Lógica do jogo Blackjack - migrada do JavaScript original
Gerencia deck, cartas, mãos, jogadores e regras do jogo
"""
import random
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from enum import Enum


class Suit(Enum):
    HEARTS = "hearts"
    DIAMONDS = "diamonds"
    CLUBS = "clubs"
    SPADES = "spades"


SUIT_SYMBOLS = {
    Suit.HEARTS: "♥",
    Suit.DIAMONDS: "♦",
    Suit.CLUBS: "♣",
    Suit.SPADES: "♠",
}

SUIT_NAMES = {
    Suit.HEARTS: "Copas",
    Suit.DIAMONDS: "Ouros",
    Suit.CLUBS: "Paus",
    Suit.SPADES: "Espadas",
}

RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']


@dataclass
class Card:
    rank: str
    suit: Suit
    
    @property
    def symbol(self) -> str:
        return SUIT_SYMBOLS[self.suit]
    
    @property
    def name(self) -> str:
        return f"{self.rank} de {SUIT_NAMES[self.suit]}"
    
    def get_value(self) -> int:
        if self.rank in ['J', 'Q', 'K']:
            return 10
        if self.rank == 'A':
            return 11
        return int(self.rank)
    
    def is_red(self) -> bool:
        return self.suit in [Suit.HEARTS, Suit.DIAMONDS]
    
    def to_dict(self) -> dict:
        return {
            'rank': self.rank,
            'suit': self.suit.value,
            'symbol': self.symbol,
            'name': self.name,
            'is_red': self.is_red()
        }


class Deck:
    def __init__(self):
        self.cards: List[Card] = []
        self.reset()
    
    def reset(self):
        self.cards = []
        for suit in Suit:
            for rank in RANKS:
                self.cards.append(Card(rank, suit))
    
    def shuffle(self):
        random.shuffle(self.cards)
    
    def draw(self) -> Optional[Card]:
        if self.is_empty():
            return None
        return self.cards.pop()
    
    def is_empty(self) -> bool:
        return len(self.cards) == 0


class Hand:
    def __init__(self, owner_name: str):
        self.owner_name = owner_name
        self.cards: List[Card] = []
    
    def add_card(self, card: Card):
        self.cards.append(card)
    
    def clear(self):
        self.cards = []
    
    def get_value(self) -> int:
        total = 0
        aces = 0
        
        for card in self.cards:
            total += card.get_value()
            if card.rank == 'A':
                aces += 1
        
        while total > 21 and aces > 0:
            total -= 10
            aces -= 1
        
        return total
    
    def to_dict(self, hide_cards: bool = False) -> dict:
        if hide_cards:
            return {
                'cards': [{'hidden': True} for _ in self.cards],
                'value': '?',
                'count': len(self.cards)
            }
        
        return {
            'cards': [card.to_dict() for card in self.cards],
            'value': self.get_value(),
            'count': len(self.cards)
        }


@dataclass
class Player:
    sid: str
    name: str
    hand: Hand = field(default_factory=lambda: Hand(""))
    wins: int = 0
    status: str = 'waiting'  # waiting, playing, stand, bust
    
    def __post_init__(self):
        self.hand = Hand(self.name)
    
    def reset_for_round(self):
        self.hand.clear()
        self.status = 'waiting'
    
    def is_bust(self) -> bool:
        return self.hand.get_value() > 21
    
    def is_done(self) -> bool:
        return self.status in ['stand', 'bust']
    
    def to_dict(self, hide_hand: bool = False, is_current: bool = False) -> dict:
        return {
            'sid': self.sid,
            'name': self.name,
            'hand': self.hand.to_dict(hide_cards=hide_hand),
            'wins': self.wins,
            'status': self.status,
            'is_current': is_current
        }


class Dealer(Player):
    def __init__(self):
        super().__init__(sid='dealer', name='Dealer')
    
    def should_hit(self) -> bool:
        return self.hand.get_value() < 17
    
    def to_dict(self, hide_second_card: bool = False) -> dict:
        hand_dict = self.hand.to_dict()
        
        if hide_second_card and len(self.hand.cards) >= 2:
            # Mostrar apenas primeira carta
            first_card = self.hand.cards[0]
            hand_dict = {
                'cards': [
                    first_card.to_dict(),
                    {'hidden': True}
                ] + [{'hidden': True} for _ in self.hand.cards[2:]],
                'value': f"{first_card.get_value()} + ?",
                'count': len(self.hand.cards)
            }
        
        return {
            'name': self.name,
            'hand': hand_dict,
            'wins': self.wins,
            'status': self.status
        }


class BlackjackGame:
    def __init__(self, room_code: str):
        self.room_code = room_code
        self.players: List[Player] = []
        self.dealer = Dealer()
        self.deck = Deck()
        self.current_player_index = 0
        self.round_active = False
        self.game_phase = 'waiting'  # waiting, playing, dealer_turn, finished
        self.event_log: List[str] = []
    
    def add_player(self, player: Player):
        self.players.append(player)
    
    def remove_player(self, sid: str) -> bool:
        initial_count = len(self.players)
        self.players = [p for p in self.players if p.sid != sid]
        return len(self.players) < initial_count
    
    def get_player_by_sid(self, sid: str) -> Optional[Player]:
        for player in self.players:
            if player.sid == sid:
                return player
        return None
    
    @property
    def current_player(self) -> Optional[Player]:
        if 0 <= self.current_player_index < len(self.players):
            return self.players[self.current_player_index]
        return None
    
    def start_round(self):
        """Inicia uma nova rodada"""
        self.event_log = []
        self.log("Uma nova rodada começou!")
        
        # Resetar todos os jogadores e dealer
        for player in self.players:
            player.reset_for_round()
        self.dealer.reset_for_round()
        
        # Resetar e embaralhar deck
        self.deck.reset()
        self.deck.shuffle()
        
        self.round_active = True
        self.current_player_index = 0
        self.game_phase = 'playing'
        
        # Distribuir cartas iniciais
        self.deal_initial_cards()
        
        # Verificar blackjacks imediatos
        self.handle_initial_blackjacks()
        
        # Mover para primeiro jogador disponível
        self.move_to_next_available_player()
    
    def deal_initial_cards(self):
        """Distribui 2 cartas para cada jogador e dealer"""
        for _ in range(2):
            for player in self.players:
                card = self.draw_card()
                player.hand.add_card(card)
                self.log(f"{player.name} recebeu uma carta.")
            
            card = self.draw_card()
            self.dealer.hand.add_card(card)
        
        self.log(f"Dealer recebeu {self.dealer.hand.cards[0].name}.")
        self.log("Dealer recebeu uma carta virada.")
    
    def handle_initial_blackjacks(self):
        """Verifica blackjacks imediatos"""
        for player in self.players:
            if player.hand.get_value() == 21:
                player.status = 'stand'
                self.log(f"{player.name} iniciou com Blackjack!")
    
    def move_to_next_available_player(self):
        """Move para o próximo jogador que ainda não finalizou"""
        while self.current_player_index < len(self.players):
            if not self.players[self.current_player_index].is_done():
                player = self.current_player
                player.status = 'playing'
                self.log(f"Vez de {player.name}.")
                return
            self.current_player_index += 1
        
        # Todos jogadores terminaram
        self.round_active = False
        self.play_dealer_turn()
    
    def handle_hit(self, sid: str) -> bool:
        """Jogador pede carta"""
        player = self.get_player_by_sid(sid)
        if not player or player != self.current_player or not self.round_active:
            return False
        
        card = self.draw_card()
        player.hand.add_card(card)
        self.log(f"{player.name} pediu carta ({card.name}).")
        
        if player.is_bust():
            player.status = 'bust'
            total = player.hand.get_value()
            self.log(f"{player.name} estourou com {total}.")
            self.advance_turn()
        
        return True
    
    def handle_stand(self, sid: str) -> bool:
        """Jogador mantém mão"""
        player = self.get_player_by_sid(sid)
        if not player or player != self.current_player or not self.round_active:
            return False
        
        player.status = 'stand'
        total = player.hand.get_value()
        self.log(f"{player.name} decidiu manter {total}.")
        self.advance_turn()
        return True
    
    def advance_turn(self):
        """Avança para próximo turno"""
        self.current_player_index += 1
        self.move_to_next_available_player()
    
    def play_dealer_turn(self):
        """Dealer joga após todos os jogadores"""
        self.game_phase = 'dealer_turn'
        self.log("Dealer está jogando...")
        self.log(f"Dealer revela sua segunda carta: {self.dealer.hand.cards[1].name}")
        
        while self.dealer.should_hit():
            card = self.draw_card()
            self.dealer.hand.add_card(card)
            self.log(f"Dealer compra {card.name}.")
        
        dealer_total = self.dealer.hand.get_value()
        if dealer_total > 21:
            self.log(f"Dealer estourou com {dealer_total}.")
        else:
            self.log(f"Dealer permanece com {dealer_total}.")
        
        self.resolve_round()
    
    def resolve_round(self):
        """Resolve a rodada e determina vencedores"""
        self.game_phase = 'finished'
        dealer_total = self.dealer.hand.get_value()
        dealer_bust = dealer_total > 21
        winners = []
        
        for player in self.players:
            player_total = player.hand.get_value()
            
            if player_total > 21:
                outcome = 'lose'
            elif dealer_bust:
                outcome = 'win'
            elif player_total > dealer_total:
                outcome = 'win'
            elif player_total == dealer_total:
                outcome = 'push'
            else:
                outcome = 'lose'
            
            if outcome == 'win':
                player.wins += 1
                winners.append(player.name)
                self.log(f"{player.name} venceu!")
            elif outcome == 'push':
                self.log(f"{player.name} empatou.")
            else:
                self.log(f"{player.name} perdeu.")
        
        if not winners and not dealer_bust:
            self.dealer.wins += 1
            self.log("Dealer venceu a rodada.")
        elif winners:
            self.log(f"Vitória de: {', '.join(winners)}.")
    
    def draw_card(self) -> Card:
        """Compra uma carta do deck"""
        if self.deck.is_empty():
            self.deck.reset()
            self.deck.shuffle()
            self.log("Baralho vazio! Reembaralhando.")
        return self.deck.draw()
    
    def log(self, message: str):
        """Adiciona mensagem ao log"""
        self.event_log.append(message)
    
    def get_game_state(self, for_player_sid: Optional[str] = None) -> dict:
        """Retorna estado do jogo"""
        current_player_sid = self.current_player.sid if self.current_player else None
        
        # Determinar se cartas devem ser escondidas
        hide_other_players = self.game_phase == 'playing'
        hide_dealer_second = self.game_phase == 'playing'
        
        players_state = []
        for player in self.players:
            is_current = player.sid == current_player_sid
            hide_hand = hide_other_players and player.sid != for_player_sid and not is_current
            players_state.append(player.to_dict(hide_hand=hide_hand, is_current=is_current))
        
        return {
            'room_code': self.room_code,
            'players': players_state,
            'dealer': self.dealer.to_dict(hide_second_card=hide_dealer_second),
            'current_player_sid': current_player_sid,
            'game_phase': self.game_phase,
            'round_active': self.round_active,
            'event_log': self.event_log[-10:],  # Últimas 10 mensagens
        }


class GameManager:
    """Gerencia múltiplas salas de jogo"""
    
    def __init__(self, sio):
        self.sio = sio
        self.rooms: Dict[str, BlackjackGame] = {}
        self.player_rooms: Dict[str, str] = {}  # sid -> room_code
    
    def get_rooms_info(self) -> List[dict]:
        """Retorna informações de todas as salas"""
        return [
            {
                'room_code': code,
                'players': [p.name for p in game.players],
                'player_count': len(game.players),
                'game_phase': game.game_phase
            }
            for code, game in self.rooms.items()
        ]
    
    async def create_room(self, sid: str, room_code: str, player_name: str, max_players: int = 4) -> dict:
        """Cria nova sala"""
        if room_code in self.rooms:
            return {'success': False, 'error': 'Sala já existe'}
        
        game = BlackjackGame(room_code)
        player = Player(sid=sid, name=player_name)
        game.add_player(player)
        
        self.rooms[room_code] = game
        self.player_rooms[sid] = room_code
        
        return {
            'success': True,
            'room_code': room_code,
            'player_name': player_name
        }
    
    async def join_room(self, sid: str, room_code: str, player_name: str) -> dict:
        """Entra em sala existente"""
        if room_code not in self.rooms:
            return {'success': False, 'error': 'Sala não encontrada'}
        
        game = self.rooms[room_code]
        
        if len(game.players) >= 4:
            return {'success': False, 'error': 'Sala cheia'}
        
        player = Player(sid=sid, name=player_name)
        game.add_player(player)
        self.player_rooms[sid] = room_code
        
        return {
            'success': True,
            'room_code': room_code,
            'players': [p.name for p in game.players]
        }
    
    async def start_game(self, sid: str, room_code: str) -> dict:
        """Inicia jogo"""
        if room_code not in self.rooms:
            return {'success': False, 'error': 'Sala não encontrada'}
        
        game = self.rooms[room_code]
        
        if len(game.players) < 2:
            return {'success': False, 'error': 'Mínimo 2 jogadores'}
        
        game.start_round()
        
        return {
            'success': True,
            'game_state': game.get_game_state()
        }
    
    async def handle_player_action(self, sid: str, room_code: str, action: str) -> dict:
        """Processa ação do jogador"""
        if room_code not in self.rooms:
            return {'success': False, 'error': 'Sala não encontrada'}
        
        game = self.rooms[room_code]
        
        if action == 'hit':
            success = game.handle_hit(sid)
        elif action == 'stand':
            success = game.handle_stand(sid)
        else:
            return {'success': False, 'error': 'Ação inválida'}
        
        if not success:
            return {'success': False, 'error': 'Ação não permitida'}
        
        return {
            'success': True,
            'game_state': game.get_game_state()
        }
    
    async def next_round(self, sid: str, room_code: str) -> dict:
        """Inicia próxima rodada"""
        if room_code not in self.rooms:
            return {'success': False, 'error': 'Sala não encontrada'}
        
        game = self.rooms[room_code]
        game.start_round()
        
        return {
            'success': True,
            'game_state': game.get_game_state()
        }
    
    async def leave_room(self, sid: str, room_code: str) -> dict:
        """Sai da sala"""
        if room_code not in self.rooms:
            return {'success': False}
        
        game = self.rooms[room_code]
        game.remove_player(sid)
        
        if sid in self.player_rooms:
            del self.player_rooms[sid]
        
        # Remover sala se vazia
        if len(game.players) == 0:
            del self.rooms[room_code]
        
        return {
            'success': True,
            'players': [p.name for p in game.players]
        }
    
    async def handle_disconnect(self, sid: str):
        """Lida com desconexão"""
        if sid in self.player_rooms:
            room_code = self.player_rooms[sid]
            await self.leave_room(sid, room_code)
            
            # Notificar outros jogadores
            if room_code in self.rooms:
                await self.sio.emit('player_disconnected', {'sid': sid}, room=room_code)
