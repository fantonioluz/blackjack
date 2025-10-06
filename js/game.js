class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
    this.symbol = Card.SUIT_SYMBOLS[suit];
    this.name = `${rank} de ${Card.SUIT_NAMES[suit]}`;
  }

  getValue() {
    if (['J', 'Q', 'K'].includes(this.rank)) {
      return 10;
    }
    if (this.rank === 'A') {
      return 11;
    }
    return Number(this.rank);
  }

  isRed() {
    return this.suit === 'hearts' || this.suit === 'diamonds';
  }
}

Card.RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
Card.SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
Card.SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};
Card.SUIT_NAMES = {
  hearts: 'Copas',
  diamonds: 'Ouros',
  clubs: 'Paus',
  spades: 'Espadas',
};

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    Card.SUITS.forEach((suit) => {
      Card.RANKS.forEach((rank) => {
        this.cards.push(new Card(rank, suit));
      });
    });
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    return this.cards.pop();
  }

  isEmpty() {
    return this.cards.length === 0;
  }
}

class Hand {
  constructor(ownerName) {
    this.ownerName = ownerName;
    this.cards = [];
  }

  addCard(card) {
    this.cards.push(card);
  }

  clear() {
    this.cards = [];
  }

  getValue() {
    let total = 0;
    let aces = 0;

    this.cards.forEach((card) => {
      total += card.getValue();
      if (card.rank === 'A') {
        aces += 1;
      }
    });

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return total;
  }
}

class Participant {
  constructor(name) {
    this.name = name;
    this.hand = new Hand(name);
    this.wins = 0;
    this.status = 'waiting';
  }

  resetForRound() {
    this.hand.clear();
    this.status = 'waiting';
  }

  isBust() {
    return this.hand.getValue() > 21;
  }

  isDone() {
    return this.status === 'stand' || this.isBust();
  }
}

class Dealer extends Participant {
  shouldHit() {
    return this.hand.getValue() < 17;
  }
}

class BlackjackUI {
  constructor() {
    this.playersArea = document.getElementById('players-area');
    this.roundStatus = document.getElementById('round-status');
    this.dealerHand = document.getElementById('dealer-hand');
    this.dealerTotal = document.getElementById('dealer-total');
    this.dealerArea = document.getElementById('dealer-area');
    this.eventLog = document.getElementById('event-log');
    this.clearLogButton = document.getElementById('clear-log');
    this.nextRoundButton = document.getElementById('next-round');
    this.resetGameButton = document.getElementById('reset-game');
    this.scoreTableBody = document.querySelector('#score-table tbody');

    if (!this.playersArea || !this.nextRoundButton || !this.resetGameButton) {
      console.error('Required DOM elements not found!');
      return;
    }

    this.playerViews = new Map();
    this.game = null;

    if (this.clearLogButton) {
      this.clearLogButton.addEventListener('click', () => this.clearLog());
    }
    
    this.resetGameButton.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  setGame(game) {
    this.game = game;
    this.dealer = game.dealer;
  }

  setupPlayers(players, handlers) {
    this.playersArea.innerHTML = '';
    this.playerViews.clear();

    players.forEach((player) => {
      const view = this.createPlayerArea(player, handlers.onHit, handlers.onStand);
      this.playerViews.set(player, view);
    });
  }

  bindNextRound(handler) {
    console.log('Binding next round handler...');
    if (this.nextRoundButton) {
      this.nextRoundButton.addEventListener('click', () => {
        console.log('Next round button clicked!');
        handler();
      });
    } else {
      console.error('Next round button not found!');
    }
  }

  createPlayerArea(player, onHit, onStand) {
    const container = document.createElement('article');
    container.className = 'player-area';
    container.dataset.player = player.name;

    const title = document.createElement('h2');
    title.textContent = player.name;

    const hand = document.createElement('div');
    hand.className = 'hand';

    const total = document.createElement('p');
    total.className = 'hand-value';
    total.textContent = 'Total: 0';

    const message = document.createElement('p');
    message.className = 'player-message';
    message.textContent = 'Aguardando cartas...';

    const controls = document.createElement('div');
    controls.className = 'controls';

    const hitButton = document.createElement('button');
    hitButton.type = 'button';
    hitButton.className = 'hit';
    hitButton.textContent = 'Pedir carta';
    hitButton.disabled = true;

    const standButton = document.createElement('button');
    standButton.type = 'button';
    standButton.className = 'stand';
    standButton.textContent = 'Manter mão';
    standButton.disabled = true;

    hitButton.addEventListener('click', () => onHit(player));
    standButton.addEventListener('click', () => onStand(player));

    controls.append(hitButton, standButton);
    container.append(title, hand, total, message, controls);
    this.playersArea.appendChild(container);

    return {
      container,
      handEl: hand,
      totalEl: total,
      messageEl: message,
      hitButton,
      standButton,
    };
  }

  prepareForNewRound(players) {
    this.enableNextRound(false);
    this.setDealerActive(false);
    this.dealerHand.innerHTML = '';
    this.dealerTotal.textContent = 'Total: 0';

    players.forEach((player) => {
      const view = this.playerViews.get(player);
      if (!view) return;
      view.handEl.innerHTML = '';
      view.totalEl.textContent = 'Total: 0';
      this.setPlayerMessage(player, 'Aguardando cartas...');
      view.hitButton.disabled = true;
      view.standButton.disabled = true;
      view.container.classList.remove('active');
    });
  }

  setActivePlayer(player) {
    this.playerViews.forEach((view, p) => {
      const isActive = p === player;
      view.container.classList.toggle('active', isActive);
      view.hitButton.disabled = !isActive;
      view.standButton.disabled = !isActive;
      if (isActive) {
        this.setPlayerMessage(p, 'É a sua vez, escolha uma ação.');
      }
    });
  }

  setDealerActive(isActive) {
    this.dealerArea.classList.toggle('active', isActive);
  }

  renderParticipant(participant) {
    if (this.playerViews.has(participant)) {
      const view = this.playerViews.get(participant);
      this.renderCards(view.handEl, participant.hand.cards);
    } else {
      this.renderCards(this.dealerHand, participant.hand.cards);
    }
  }

  renderPlayer(player, isCurrentPlayer = false, gamePhase = 'playing') {
    const view = this.playerViews.get(player);
    if (!view) return;
    
    const hideCards = gamePhase === 'playing' && !isCurrentPlayer;
    
    this.renderCards(view.handEl, player.hand.cards, { hideAll: hideCards });
  }

  renderDealer(gamePhase = 'playing') {
    const hideSecondCard = gamePhase === 'playing';
    
    this.renderCards(this.dealerHand, this.dealer.hand.cards, { hideSecondCard });
  }

  renderAllPlayers(currentPlayerIndex = -1, gamePhase = 'playing') {
    this.playerViews.forEach((view, player) => {
      const playerIndex = this.game ? this.game.players.indexOf(player) : -1;
      const isCurrentPlayer = playerIndex === currentPlayerIndex;
      this.renderPlayer(player, isCurrentPlayer, gamePhase);
    });
  }

  renderCards(container, cards, options = {}) {
    const { hideSecondCard = false, hideAll = false, currentPlayerIndex = -1, playerIndex = -1 } = options;
    
    container.innerHTML = '';
    cards.forEach((card, index) => {
      let shouldHide = false;
      
      if (hideAll) {
        shouldHide = true;
      } else if (hideSecondCard && index === 1) {
        shouldHide = true;
      }
      
      container.appendChild(this.createCardElement(card, shouldHide));
    });
  }

  createCardElement(card, hidden = false) {
    const figure = document.createElement('figure');
    figure.className = 'card';
    
    if (hidden) {
      figure.classList.add('face-down');
      
      const backPattern = document.createElement('div');
      backPattern.className = 'card-back';
      
      const centerIcon = document.createElement('div');
      centerIcon.style.cssText = `
        font-size: 3rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        filter: drop-shadow(0 0 5px rgba(244, 180, 0, 0.5));
      `;
      centerIcon.textContent = '♠';
      
      backPattern.appendChild(centerIcon);
      figure.appendChild(backPattern);
      return figure;
    }
    
    if (card.isRed()) {
      figure.classList.add('red');
    }

    const topCorner = document.createElement('span');
    topCorner.className = 'corner top';
    topCorner.textContent = `${card.rank}${card.symbol}`;

    const suit = document.createElement('span');
    suit.className = 'suit';
    suit.textContent = card.symbol;

    const bottomCorner = document.createElement('span');
    bottomCorner.className = 'corner bottom';
    bottomCorner.textContent = `${card.symbol}${card.rank}`;

    figure.append(topCorner, suit, bottomCorner);
    return figure;
  }

  updateTotals(participant) {
    if (this.playerViews.has(participant)) {
      const view = this.playerViews.get(participant);
      view.totalEl.textContent = `Total: ${participant.hand.getValue()}`;
    } else {
      this.dealerTotal.textContent = `Total: ${participant.hand.getValue()}`;
    }
  }

  updateDealerTotal(gamePhase = 'playing') {
    if (gamePhase === 'playing' && this.dealer.hand.cards.length >= 2) {
      const firstCardValue = this.dealer.hand.cards[0].getValue();
      this.dealerTotal.textContent = `Total: ${firstCardValue} + ?`;
    } else {
      this.dealerTotal.textContent = `Total: ${this.dealer.hand.getValue()}`;
    }
  }

  setPlayerMessage(player, message, statusClass) {
    const view = this.playerViews.get(player);
    if (!view) return;
    view.messageEl.textContent = message;
    view.messageEl.className = 'player-message';
    if (statusClass) {
      view.messageEl.classList.add(statusClass);
    }
  }

  log(message) {
    const item = document.createElement('li');
    item.textContent = message;
    this.eventLog.appendChild(item);
    if (this.eventLog.childElementCount > 8) {
      this.eventLog.removeChild(this.eventLog.firstElementChild);
    }
    this.eventLog.scrollTop = this.eventLog.scrollHeight;
  }

  clearLog() {
    this.eventLog.innerHTML = '';
  }

  updateRoundStatus(message) {
    this.roundStatus.textContent = message;
  }

  enableNextRound(enabled) {
    console.log('Enabling next round button:', enabled);
    if (this.nextRoundButton) {
      this.nextRoundButton.disabled = !enabled;
    }
  }

  updateScoreboard(players, dealer) {
    this.scoreTableBody.innerHTML = '';
    [...players, dealer].forEach((participant) => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      nameCell.textContent = participant.name;
      const scoreCell = document.createElement('td');
      scoreCell.textContent = participant.wins;
      row.append(nameCell, scoreCell);
      this.scoreTableBody.appendChild(row);
    });
  }
}

class BlackjackGame {
  constructor(playerNames, ui) {
    this.players = playerNames.map((name) => new Participant(name));
    this.dealer = new Dealer('Dealer');
    this.ui = ui;
    this.deck = new Deck();
    this.roundActive = false;
    this.currentPlayerIndex = 0;

    this.ui.setGame(this);
    
    this.deck.shuffle();

    this.ui.setupPlayers(this.players, {
      onHit: (player) => this.handleHit(player),
      onStand: (player) => this.handleStand(player),
    });

    this.ui.bindNextRound(() => this.startRound());
    this.ui.updateScoreboard(this.players, this.dealer);

    this.startRound();
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  startRound() {
    console.log('Starting new round...');
    this.players.forEach((player) => player.resetForRound());
    this.dealer.resetForRound();
    this.roundActive = true;
    this.currentPlayerIndex = 0;

    this.deck.reset();
    this.deck.shuffle();

    this.ui.prepareForNewRound(this.players);
    this.ui.updateRoundStatus('Distribuindo cartas...');
    this.ui.log('Uma nova rodada começou!');

    this.dealInitialCards();
    this.handleInitialBlackjacks();
    this.moveToNextAvailablePlayer();
  }

  dealInitialCards() {
    for (let i = 0; i < 2; i += 1) {
      this.players.forEach((player) => {
        const card = this.drawCard();
        player.hand.addCard(card);
        this.ui.log(`${player.name} recebeu uma carta.`);
      });
      
      const dealerCard = this.drawCard();
      this.dealer.hand.addCard(dealerCard);
      
      if (i === 0) {
        this.ui.log(`Dealer recebeu ${dealerCard.name}.`);
      } else {
        this.ui.log(`Dealer recebeu uma carta virada.`);
      }
    }
    
    this.ui.renderDealer('playing');
    this.ui.renderAllPlayers(this.currentPlayerIndex, 'playing');
    
    this.ui.updateTotals(this.currentPlayer);
    this.ui.updateDealerTotal('playing');
  }

  handleInitialBlackjacks() {
    let blackjackPlayers = [];
    this.players.forEach((player) => {
      if (player.hand.getValue() === 21) {
        player.status = 'stand';
        this.ui.setPlayerMessage(player, 'Blackjack imediato!', 'win');
        this.ui.log(`${player.name} iniciou com Blackjack!`);
        blackjackPlayers.push(player);
      }
    });

    if (blackjackPlayers.length > 0) {
      this.ui.updateRoundStatus('Alguns jogadores já começaram com Blackjack!');
    }
  }

  moveToNextAvailablePlayer() {
    this.currentPlayerIndex = this.players.findIndex((player) => !player.isDone());

    if (this.currentPlayerIndex === -1) {
      this.roundActive = false;
      this.ui.setActivePlayer(null);
      this.playDealerTurn();
      return;
    }

    const player = this.currentPlayer;
    this.ui.setActivePlayer(player);
    this.ui.updateRoundStatus(`Vez de ${player.name}. Escolha pedir carta ou manter.`);
    
    this.ui.renderAllPlayers(this.currentPlayerIndex, 'playing');
    this.ui.updateTotals(player);
  }

  handleHit(player) {
    if (!this.roundActive || this.currentPlayer !== player) {
      return;
    }

    const card = this.drawCard();
    player.hand.addCard(card);
    
    this.ui.renderPlayer(player, true, 'playing');
    this.ui.updateTotals(player);
    this.ui.log(`${player.name} pediu carta (${card.name}).`);

    if (player.isBust()) {
      player.status = 'bust';
      const total = player.hand.getValue();
      this.ui.setPlayerMessage(player, `Estourou com ${total}.`, 'bust');
      this.ui.log(`${player.name} estourou com ${total}.`);
      this.advanceTurn();
    }
  }

  handleStand(player) {
    if (!this.roundActive || this.currentPlayer !== player) {
      return;
    }

    player.status = 'stand';
    const total = player.hand.getValue();
    this.ui.setPlayerMessage(player, `Parou com ${total}.`);
    this.ui.log(`${player.name} decidiu manter ${total}.`);
    this.advanceTurn();
  }

  advanceTurn() {
    this.currentPlayerIndex += 1;
    while (
      this.currentPlayerIndex < this.players.length &&
      this.players[this.currentPlayerIndex].isDone()
    ) {
      this.currentPlayerIndex += 1;
    }

    if (this.currentPlayerIndex >= this.players.length) {
      this.roundActive = false;
      this.ui.setActivePlayer(null);
      this.playDealerTurn();
      return;
    }

    const player = this.currentPlayer;
    this.ui.setActivePlayer(player);
    this.ui.updateRoundStatus(`Vez de ${player.name}. Escolha pedir carta ou manter.`);
    
    this.ui.renderAllPlayers(this.currentPlayerIndex, 'playing');
    this.ui.updateTotals(player);
  }

  playDealerTurn() {
    this.ui.setDealerActive(true);
    this.ui.updateRoundStatus('Dealer está jogando...');
    
    this.ui.renderAllPlayers(-1, 'final');
    this.ui.renderDealer('final');
    this.ui.updateDealerTotal('final');
    
    this.players.forEach(player => this.ui.updateTotals(player));

    this.ui.log(`Dealer revela sua segunda carta: ${this.dealer.hand.cards[1].name}`);

    while (this.dealer.shouldHit()) {
      const card = this.drawCard();
      this.dealer.hand.addCard(card);
      this.ui.renderDealer('final');
      this.ui.updateDealerTotal('final');
      this.ui.log(`Dealer compra ${card.name}.`);
    }

    const dealerTotal = this.dealer.hand.getValue();
    if (dealerTotal > 21) {
      this.ui.log(`Dealer estourou com ${dealerTotal}.`);
    } else {
      this.ui.log(`Dealer permanece com ${dealerTotal}.`);
    }

    this.ui.setDealerActive(false);
    this.resolveRound();
  }

  resolveRound() {
    const dealerTotal = this.dealer.hand.getValue();
    const dealerBust = dealerTotal > 21;
    const winners = [];
    let dealerWonRound = !dealerBust;
    let anyPlayerWin = false;

    this.roundActive = false;
    this.ui.setActivePlayer(null);

    this.players.forEach((player) => {
      const playerTotal = player.hand.getValue();
      let outcome;
      let message;

      if (playerTotal > 21) {
        outcome = 'lose';
        message = `${player.name} estourou.`;
      } else if (dealerBust) {
        outcome = 'win';
        message = `${player.name} vence! Dealer estourou.`;
      } else if (playerTotal > dealerTotal) {
        outcome = 'win';
        message = `${player.name} vence com ${playerTotal} contra ${dealerTotal}.`;
      } else if (playerTotal === dealerTotal) {
        outcome = 'push';
        message = `${player.name} empatou com ${dealerTotal}.`;
      } else {
        outcome = 'lose';
        message = `${player.name} perdeu com ${playerTotal} contra ${dealerTotal}.`;
      }

      if (outcome === 'win') {
        player.wins += 1;
        winners.push(player.name);
        anyPlayerWin = true;
      }

      if (outcome !== 'lose') {
        dealerWonRound = false;
      }

      const cssClass = outcome === 'lose' && playerTotal > 21 ? 'bust' : outcome;
      this.ui.setPlayerMessage(player, message, cssClass === 'stand' ? undefined : cssClass);
    });

    if (!anyPlayerWin && dealerWonRound) {
      this.dealer.wins += 1;
      this.ui.log('Dealer venceu a rodada.');
      this.ui.updateRoundStatus('Dealer venceu esta rodada.');
    } else if (winners.length > 0) {
      this.ui.log(`Vitória de: ${winners.join(', ')}.`);
      this.ui.updateRoundStatus(`Vencedores da rodada: ${winners.join(', ')}.`);
    } else {
      this.ui.log('A rodada terminou empatada.');
      this.ui.updateRoundStatus('Rodada empatada!');
    }

    this.ui.updateScoreboard(this.players, this.dealer);
    this.ui.enableNextRound(true);
  }

  drawCard() {
    if (this.deck.isEmpty()) {
      this.deck.reset();
      this.deck.shuffle();
      this.ui.log('Baralho vazio! Reembaralhando.');
    }
    return this.deck.draw();
  }
}

function getPlayerNamesFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const entries = Array.from(params.entries())
    .filter(([key]) => key.startsWith('player'))
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  const names = entries.map(([, value]) => value.trim()).filter((value) => value.length > 0);
  return names;
}

function initializeBlackjackGame() {
  const playerNames = getPlayerNamesFromQuery();
  if (playerNames.length < 2) {
    window.location.href = 'index.html';
  } else {
    console.log('Players found:', playerNames);
    const ui = new BlackjackUI();
    const game = new BlackjackGame(playerNames, ui);

    window.blackjackGame = game;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBlackjackGame);
} else {
  initializeBlackjackGame();
}
