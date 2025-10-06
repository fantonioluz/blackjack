const MAX_PLAYERS = 4;

// Função principal que inicializa o jogo
function initializeGame() {
  const playersGrid = document.getElementById('players-grid');
  const addPlayerButton = document.getElementById('add-player');
  const setupForm = document.getElementById('setup-form');

  if (!playersGrid || !addPlayerButton || !setupForm) {
    console.error('Required elements not found!');
    return;
  }

function createPlayerField(index) {
  const label = document.createElement('label');
  label.className = 'player-field';

  const span = document.createElement('span');
  span.textContent = `Jogador ${index}`;

  const input = document.createElement('input');
  input.type = 'text';
  input.name = `player-${index}`;
  input.placeholder = 'Nome do jogador';
  input.className = 'player-name';
  input.required = true;

  label.append(span, input);
  return label;
}

addPlayerButton.addEventListener('click', () => {
  const currentPlayers = playersGrid.querySelectorAll('.player-field').length;
  if (currentPlayers >= MAX_PLAYERS) {
    addPlayerButton.disabled = true;
    addPlayerButton.textContent = 'Limite alcançado';
    return;
  }

  const newIndex = currentPlayers + 1;
  const field = createPlayerField(newIndex);
  playersGrid.appendChild(field);
  field.querySelector('input').focus();

  if (newIndex === MAX_PLAYERS) {
    addPlayerButton.disabled = true;
    addPlayerButton.textContent = 'Limite alcançado';
  }
});

setupForm.addEventListener('submit', (event) => {
  console.log('Form submitted!'); // Debug log
  event.preventDefault();

  const names = Array.from(playersGrid.querySelectorAll('.player-name'))
    .map((input) => input.value.trim())
    .filter((name) => name.length > 0);

  if (names.length < 2) {
    alert('Informe ao menos dois jogadores para iniciar.');
    return;
  }

  const searchParams = new URLSearchParams();
  names.forEach((name, index) => {
    searchParams.append(`player${index + 1}`, name);
  });

  window.location.href = `game.html?${searchParams.toString()}`;
});

}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}
