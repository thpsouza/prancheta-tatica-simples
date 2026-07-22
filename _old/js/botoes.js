// FUNÇÃO DO BOTÃO LIMPAR 
// (Desmarca jogador selecionado e remove os jogadores adicionados manualmente do banco)
function clearLineup() {
  if (selectedBenchPlayer) {
    selectedBenchPlayer.classList.remove('selected');
    selectedBenchPlayer = null;
  }
  const customBenchPlayers = benchList.querySelectorAll('.custom-player');
  customBenchPlayers.forEach(player => player.remove());
  saveState();
}


// FUNÇÃO DO BOTÃO EDITAR POSIÇÃO 
// (Permite alterar manualmente a tática)
function editPositions() {
  isEditMode = !isEditMode;
  pitch.classList.toggle('edit-mode', isEditMode);
  editModeBtn.classList.toggle('active', isEditMode);
  editModeBtn.innerText = isEditMode ? 'Salvar Posições' : 'Editar';
  if (isEditMode && selectedBenchPlayer) {
    selectedBenchPlayer.classList.remove('selected');
    selectedBenchPlayer = null;
  }
  saveState();
}

// FUNÇÃO DO BOTÃO RESET 
// (Limpa o campo e reseta as posições)
function resetTactics() {
  const layout = tacticsMap[tacticSelector.value];
  layout.forEach(pos => {
    const slot = document.getElementById('slot-' + pos.id);
    if (slot) {
      slot.style.left = pos.x + '%';
      slot.style.bottom = pos.y + '%';
    }
  });
  const clonesOnPitch = pitch.querySelectorAll('.slot .player');
  clonesOnPitch.forEach(clone => clone.remove());
  saveState();
}


// FUNÇÃO BOTÃO ADICIONAR PLAYER 
// (Adicionar novo player no banco)
function addNewPlayerToBench() {
  const name = newPlayerInput.value.trim();
  if (!name) return;
  createCustomPlayer('p-' + Date.now(), name);
  newPlayerInput.value = '';
  newPlayerInput.focus();
  saveState();
}


// FUNÇÃO BOTÃO EXPORTAR PNG
function exportPNG() {
  if (isEditMode) editModeBtn.click(); 

  const slots = pitch.querySelectorAll('.slot');
  const slotWidths = Array.from(slots).map(slot => slot.offsetWidth);

  const originalTransform = pitch.style.transform;
  pitch.style.transform = 'none';

  html2canvas(pitch, { 
    backgroundColor: '#2e7d32', 
    scale: 2,
    onclone: (clonedDoc) => {
      const clonedPitch = clonedDoc.getElementById('pitch');
      const clonedSlots = clonedPitch.querySelectorAll('.slot');
      clonedSlots.forEach((clonedSlot, index) => {
        clonedSlot.style.transform = 'none';
        clonedSlot.style.marginLeft = `-${slotWidths[index] / 2}px`;
        clonedSlot.style.maxHeight = 'none';
        clonedSlot.style.overflow = 'visible';
      });
    }
  }).then(canvas => {
    pitch.style.transform = originalTransform; 
    const link = document.createElement('a');
    link.download = 'escalacao-time.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}


// FUNÇÃO BOTÃO WPP
function exportWpp() {
  let text = "*⚽ Escalação do Time*\n\n";
  const slots = pitch.querySelectorAll('.slot');
  let hasPlayers = false;

  slots.forEach(slot => {
    const posName = slot.querySelector('.slot-title').innerText;
    const players = slot.querySelectorAll('.player');
    
    if (players.length > 0) {
      hasPlayers = true;
      const playerNames = Array.from(players).map((p, index) => {
         return index === 0 ? `*${p.innerText}*` : p.innerText; // titular em negrito
      }).join(', ');
      text += `*${posName}*: ${playerNames}\n`;
    }
  });

  if (!hasPlayers) {
    alert("Adicione jogadores no campo antes de enviar!");
    return;
  }

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}