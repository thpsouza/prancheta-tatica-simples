// Função para desenhar a tática
function renderTactic(tacticKey) {

  const oldSlots = pitch.querySelectorAll('.slot');
  oldSlots.forEach(slot => slot.remove());

  const layout = tacticsMap[tacticKey];
  layout.forEach(pos => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.style.left = pos.x + '%';
    slot.style.bottom = pos.y + '%'; 
    slot.id = 'slot-' + pos.id;

    const title = document.createElement('div');
    title.className = 'slot-title';
    title.innerText = pos.name;
    slot.appendChild(title);

    setupSlotRepositioning(slot);
    setupDropZone(slot);
    setupSlotClick(slot);
    pitch.appendChild(slot);
  });
}


// Configuração do Arraste do Próprio Slot
function setupSlotRepositioning(slot) {
  slot.addEventListener('pointerdown', (e) => {
    if (!isEditMode) return;

    e.preventDefault();
    e.stopPropagation();

    const pitchRect = pitch.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const startLeft = parseFloat(slot.style.left) || 50;
    const startBottom = parseFloat(slot.style.bottom) || 50;

    function onPointerMove(moveEvent) {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const deltaXPercent = (deltaX / pitchRect.width) * 100;
      const deltaYPercent = (-deltaY / pitchRect.height) * 100; // Invertido pq bottom cresce pra cima

      let newLeft = startLeft + deltaXPercent;
      let newBottom = startBottom + deltaYPercent;

      const slotWidth = slot.getBoundingClientRect().width;
      const slotHeight = slot.getBoundingClientRect().height;
      const minLeft = 2 + (slotWidth / 2 / pitchRect.width) * 100;
      const maxLeft = 98 - (slotWidth / 2 / pitchRect.width) * 100;
      const minBottom = 2 + (slotHeight / 2 / pitchRect.height) * 100;
      const maxBottom = 92 - (slotHeight / 2 / pitchRect.height) * 100;

      newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
      newBottom = Math.max(minBottom, Math.min(maxBottom, newBottom));

      slot.style.left = newLeft.toFixed(1) + '%';
      slot.style.bottom = newBottom.toFixed(1) + '%';
    }

    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      saveState();
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  });
}


// Lógica de Opacidade Dinâmica
function updateSlotOpacities(slot) {
  const players = slot.querySelectorAll('.player');
  players.forEach((p, index) => {
    if (index === 0) {
      p.style.opacity = '1'; // Titular
    } else {
      p.style.opacity = '0.4'; // Reservas
    }
  });

  requestAnimationFrame(() => {
    const pitchRect = pitch.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();

    if (slotRect.top < pitchRect.top) {
      const overflowPx = pitchRect.top - slotRect.top + 2;
      const overflowPercent = (overflowPx / pitchRect.height) * 100;
      const currentBottom = parseFloat(slot.style.bottom) || 50;
      const minBottom = 2;
      const newBottom = Math.max(minBottom, currentBottom - overflowPercent);
      slot.style.bottom = `${newBottom.toFixed(1)}%`;
    }
  });
}


// Cria o clone configurado para o campo
function createFieldClone(originalEl, slot) {
  const originalId = originalEl.dataset.originalId || originalEl.id;
  
  if (slot.querySelector(`[data-original-id="${originalId}"]`)) {
    return null;
  }

  const clone = originalEl.cloneNode(true);
  clone.id = originalId + '-clone-' + Date.now();
  clone.dataset.originalId = originalId;
  clone.classList.remove('selected');
  
  enablePlayerDragging(clone, true);

  clone.addEventListener('click', (ev) => {
    if (selectedBenchPlayer || isEditMode) return;
    
    ev.stopPropagation(); 
    const parentSlot = clone.closest('.slot');
    clone.remove();
    if (parentSlot) updateSlotOpacities(parentSlot);
    saveState();
  });
  
  clone.title = "Clique para remover";
  return clone;
}


function enablePlayerDragging(playerEl, isClone = false) {
  playerEl.draggable = true;
  playerEl.addEventListener('dragstart', (e) => {
    if (isEditMode) {
      e.preventDefault(); // Desativa o arraste de jogador se estiver editando posições
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', playerEl.id);
    e.dataTransfer.setData('is-clone', isClone ? 'true' : 'false');
    setTimeout(() => { playerEl.style.opacity = '0.4'; }, 0);
  });

  playerEl.addEventListener('dragend', () => {
    if (!isClone) playerEl.style.opacity = '1'; 
  });
}


function setupDragAndDrop() {
  const initialPlayers = benchList.querySelectorAll('.player');
  initialPlayers.forEach(p => {
    enablePlayerDragging(p, false);

    p.addEventListener('click', () => {
      if (isEditMode) return;
      
      // Desmarca o anterior se houver
      if (selectedBenchPlayer) selectedBenchPlayer.classList.remove('selected');
      
      // Se clicou no mesmo, apenas desmarca. Se clicou em outro, marca.
      if (selectedBenchPlayer === p) {
        selectedBenchPlayer = null;
      } else {
        selectedBenchPlayer = p;
        p.classList.add('selected');
      }
    });
  });
}


function setupSlotClick(slot) {
  slot.addEventListener('click', () => {
    if (isEditMode) return;
    if (selectedBenchPlayer) {
      const clone = createFieldClone(selectedBenchPlayer, slot);
      if (clone) {
        slot.appendChild(clone);
        updateSlotOpacities(slot);

        // Desmarcar player após inserir
        selectedBenchPlayer.classList.remove('selected');
        selectedBenchPlayer = null;
        saveState();
      }
    }
  });
}


function setupDropZone(slot) {
  slot.addEventListener('dragover', (e) => {
    if (isEditMode) return;
    e.preventDefault();
    slot.classList.add('drag-over');
  });

  slot.addEventListener('dragleave', () => {
    slot.classList.remove('drag-over');
  });

  slot.addEventListener('drop', (e) => {
    if (isEditMode) return;

    e.preventDefault();
    e.stopPropagation();
    slot.classList.remove('drag-over');

    const draggedId = e.dataTransfer.getData('text/plain');
    const isClone = e.dataTransfer.getData('is-clone') === 'true';
    const draggedEl = document.getElementById(draggedId);

    if (!draggedEl) return;

    const oldSlot = draggedEl.closest('.slot');

    if (!isClone) {
      const clone = createFieldClone(draggedEl, slot);
      if (!clone) return;
      slot.appendChild(clone); 
    } else {
      const targetPlayer = e.target.closest('.player');
      const originalId = draggedEl.dataset.originalId;
      
      if (draggedEl.parentNode !== slot && slot.querySelector(`[data-original-id="${originalId}"]`)) {
        return; 
      }

      if (targetPlayer && targetPlayer.parentNode === slot) {
        slot.insertBefore(draggedEl, targetPlayer);
      } else {
        slot.appendChild(draggedEl);
      }
    }

    updateSlotOpacities(slot);
    if (oldSlot && oldSlot !== slot) {
      updateSlotOpacities(oldSlot);
    }
    saveState();
  });
}


function createCustomPlayer(id, name) {
  const newPlayer = document.createElement('div');
  newPlayer.className = 'player custom-player';
  newPlayer.id = id;
  newPlayer.innerText = name;
  enablePlayerDragging(newPlayer, false);

  newPlayer.addEventListener('click', () => {
    if (isEditMode) return;
    if (selectedBenchPlayer) selectedBenchPlayer.classList.remove('selected');
    if (selectedBenchPlayer === newPlayer) {
      selectedBenchPlayer = null;
    } else {
      selectedBenchPlayer = newPlayer;
      newPlayer.classList.add('selected');
    }
  });
  benchList.appendChild(newPlayer);
}


// Salvar no LocalStorage
function saveState() {
  const state = { tactic: tacticSelector.value, slots: [], customBench: [] };
  pitch.querySelectorAll('.slot').forEach(slot => {
    state.slots.push({
      id: slot.id,
      left: slot.style.left,
      bottom: slot.style.bottom,
      players: Array.from(slot.querySelectorAll('.player')).map(p => ({ id: p.dataset.originalId }))
    });
  });
  benchList.querySelectorAll('.custom-player').forEach(p => {
     state.customBench.push({ id: p.id, name: p.innerText });
  });
  localStorage.setItem('squadState', JSON.stringify(state));
}


// Carregar do LocalStorage
function loadState() {
  const saved = localStorage.getItem('squadState');
  if (!saved) return false;
  const state = JSON.parse(saved);

  // Recria os jogadores customizados do banco
  state.customBench.forEach(cb => { createCustomPlayer(cb.id, cb.name); });

  // Recria e preenche os slots
  tacticSelector.value = state.tactic;
  renderTactic(state.tactic);
  state.slots.forEach(slotData => {
     const slot = document.getElementById(slotData.id);
     if (slot) {
        slot.style.left = slotData.left;
        slot.style.bottom = slotData.bottom;
        
        slotData.players.forEach(pData => {
           const original = document.getElementById(pData.id);
           if (original) {
               const clone = createFieldClone(original, slot);
               if (clone) slot.appendChild(clone);
           }
        });
        updateSlotOpacities(slot);
     }
  });
  return true;
}