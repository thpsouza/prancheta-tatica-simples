const tacticsMap = window.tacticsMap;

// Campo
const pitch = document.getElementById('pitch');
const benchList = document.getElementById('bench-list');
const tacticSelector = document.getElementById('tactic-selector');
const editModeBtn = document.getElementById('toggle-edit-mode');
const resetTacticBtn = document.getElementById('reset-tactic-btn');

// Banco
const newPlayerInput = document.getElementById('new-player-input');
const addPlayerBtn = document.getElementById('add-player-btn');
const clearBtn = document.getElementById('reset-lineup');

// Toolbar
const exportImgBtn = document.getElementById('export-img-btn');
const whatsappBtn = document.getElementById('whatsapp-btn');

let selectedBenchPlayer = null;
let isEditMode = false;


//// EVENTOS
clearBtn.addEventListener(
    'click', clearLineup
);
editModeBtn.addEventListener(
    'click', editPositions
);
resetTacticBtn.addEventListener(
    'click', resetTactics
);
addPlayerBtn.addEventListener(
    'click', addNewPlayerToBench
);
newPlayerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addNewPlayerToBench();
  }
});
tacticSelector.addEventListener(
    'change', (e) => renderTactic(e.target.value)
);
exportImgBtn.addEventListener(
    'click', exportPNG
);
whatsappBtn.addEventListener(
    'click', exportWpp
);

MobileDragDrop.polyfill({
    holdToDrag: 150 
});

window.addEventListener('touchmove', function() {}, {passive: false});

// Inicializar
setupDragAndDrop();
if (!loadState()) {
  renderTactic('3-2-1');
}