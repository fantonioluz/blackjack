"""
Testes básicos para a lógica do jogo Blackjack
Execute com: pytest test_game_logic.py
"""
import pytest
from game_logic import Card, Deck, Hand, Player, Dealer, BlackjackGame, Suit


def test_card_values():
    """Testa valores das cartas"""
    assert Card('A', Suit.HEARTS).get_value() == 11
    assert Card('K', Suit.SPADES).get_value() == 10
    assert Card('Q', Suit.DIAMONDS).get_value() == 10
    assert Card('J', Suit.CLUBS).get_value() == 10
    assert Card('5', Suit.HEARTS).get_value() == 5


def test_card_colors():
    """Testa cores das cartas"""
    assert Card('A', Suit.HEARTS).is_red() == True
    assert Card('A', Suit.DIAMONDS).is_red() == True
    assert Card('A', Suit.CLUBS).is_red() == False
    assert Card('A', Suit.SPADES).is_red() == False


def test_deck_creation():
    """Testa criação do deck"""
    deck = Deck()
    assert len(deck.cards) == 52
    assert deck.is_empty() == False


def test_deck_draw():
    """Testa compra de cartas"""
    deck = Deck()
    card = deck.draw()
    assert isinstance(card, Card)
    assert len(deck.cards) == 51


def test_hand_value_simple():
    """Testa cálculo de mão simples"""
    hand = Hand("Test")
    hand.add_card(Card('5', Suit.HEARTS))
    hand.add_card(Card('7', Suit.DIAMONDS))
    assert hand.get_value() == 12


def test_hand_value_with_ace():
    """Testa cálculo com Ás"""
    hand = Hand("Test")
    hand.add_card(Card('A', Suit.HEARTS))
    hand.add_card(Card('5', Suit.DIAMONDS))
    assert hand.get_value() == 16  # Ás conta como 11


def test_hand_value_ace_adjustment():
    """Testa ajuste do Ás quando estoura"""
    hand = Hand("Test")
    hand.add_card(Card('A', Suit.HEARTS))
    hand.add_card(Card('K', Suit.DIAMONDS))
    hand.add_card(Card('9', Suit.CLUBS))
    assert hand.get_value() == 20  # Ás ajustado para 1


def test_hand_blackjack():
    """Testa Blackjack (21 com 2 cartas)"""
    hand = Hand("Test")
    hand.add_card(Card('A', Suit.HEARTS))
    hand.add_card(Card('K', Suit.DIAMONDS))
    assert hand.get_value() == 21


def test_player_bust():
    """Testa se jogador estourou"""
    player = Player(sid="test1", name="Test Player")
    player.hand.add_card(Card('K', Suit.HEARTS))
    player.hand.add_card(Card('Q', Suit.DIAMONDS))
    player.hand.add_card(Card('5', Suit.CLUBS))
    assert player.is_bust() == True
    assert player.hand.get_value() == 25


def test_dealer_should_hit():
    """Testa quando dealer deve comprar"""
    dealer = Dealer()
    dealer.hand.add_card(Card('10', Suit.HEARTS))
    dealer.hand.add_card(Card('5', Suit.DIAMONDS))
    assert dealer.should_hit() == True  # 15 < 17
    
    dealer.hand.add_card(Card('3', Suit.CLUBS))
    assert dealer.should_hit() == False  # 18 >= 17


def test_game_creation():
    """Testa criação do jogo"""
    game = BlackjackGame("TEST123")
    assert game.room_code == "TEST123"
    assert len(game.players) == 0
    assert game.round_active == False


def test_add_remove_player():
    """Testa adicionar e remover jogador"""
    game = BlackjackGame("TEST123")
    player = Player(sid="p1", name="Player 1")
    
    game.add_player(player)
    assert len(game.players) == 1
    
    removed = game.remove_player("p1")
    assert removed == True
    assert len(game.players) == 0


def test_game_state_serialization():
    """Testa serialização do estado do jogo"""
    game = BlackjackGame("TEST123")
    player = Player(sid="p1", name="Player 1")
    game.add_player(player)
    
    state = game.get_game_state()
    assert state['room_code'] == "TEST123"
    assert len(state['players']) == 1
    assert 'dealer' in state
    assert 'event_log' in state


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
