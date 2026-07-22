const pitchJogadas = document.getElementById('pitch-jogadas');
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const toolMoveBtn = document.getElementById('tool-move');
const toolFreeDrawBtn = document.getElementById('tool-freedraw');
const toolLineBtn = document.getElementById('tool-line');
const toolEraserBtn = document.getElementById('tool-eraser');
const clearCanvasBtn = document.getElementById('clear-canvas');
const opponentBox = document.getElementById('opponent-box');
const drawColorInput = document.getElementById('draw-color');
const drawWidthInput = document.getElementById('draw-width');
const eraserCursor = document.getElementById('eraser-cursor');

let currentTool = 'move';
let isDrawing = false;
let startX = 0;
let startY = 0;
let savedCanvasState = null;
let lastTactic = null;

// ===================== FERRAMENTAS =====================
function setActiveToolBtn(activeBtn) {
    // Remove a classe 'active' de todos os botões
    [toolMoveBtn, toolFreeDrawBtn, toolLineBtn, toolEraserBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    
    // Adiciona a classe 'active' no botão clicado
    if (activeBtn) activeBtn.classList.add('active');

    // Configura o comportamento do canvas e das peças dependendo da ferramenta
    if (currentTool === 'move') {
        canvas.style.pointerEvents = 'none';
        eraserCursor.style.display = 'none';
        canvas.style.cursor = 'default';
        
        // Remove a classe para permitir que as peças (tokens) recebam cliques/arrastos
        pitchJogadas.classList.remove('drawing-mode'); 
        
    } else if (currentTool === 'eraser') {
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'none';
        
        // Adiciona a classe para ignorar as peças, permitindo que a borracha passe por cima
        pitchJogadas.classList.add('drawing-mode'); 
        
    } else {
        canvas.style.pointerEvents = 'auto';
        eraserCursor.style.display = 'none';
        canvas.style.cursor = 'crosshair';
        
        // Adiciona a classe para ignorar as peças, permitindo desenhar por cima delas
        pitchJogadas.classList.add('drawing-mode'); 
    }
}

// Inicialmente: Mover Peças
setActiveToolBtn(toolMoveBtn);

toolMoveBtn.addEventListener('click', () => {
    currentTool = 'move';
    setActiveToolBtn(toolMoveBtn);
});

toolFreeDrawBtn.addEventListener('click', () => {
    currentTool = 'freedraw';
    setActiveToolBtn(toolFreeDrawBtn);
});

toolLineBtn.addEventListener('click', () => {
    currentTool = 'line';
    setActiveToolBtn(toolLineBtn);
});

toolEraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    setActiveToolBtn(toolEraserBtn);
});

clearCanvasBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// ===================== CANVAS SIZING =====================
function resizeCanvas() {
    const w = pitchJogadas.clientWidth;
    const h = pitchJogadas.clientHeight;
    if (w === 0 || h === 0) return;

    // Salvar conteúdo existente
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    if (canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
    }

    // Setar tamanho real em pixels (NÃO via CSS)
    canvas.width = w;
    canvas.height = h;

    // Restaurar conteúdo
    if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0);
    }
}
window.addEventListener('resize', resizeCanvas);

// ===================== DESENHO =====================
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function startDrawing(e) {
    if (currentTool === 'move') return;
    e.preventDefault();
    isDrawing = true;
    const pos = getPointerPos(e);
    startX = pos.x;
    startY = pos.y;

    if (currentTool === 'line') {
        savedCanvasState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = (drawWidthInput ? parseInt(drawWidthInput.value) : 3) * 5;
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColorInput ? drawColorInput.value : '#ffffff';
        ctx.lineWidth = drawWidthInput ? parseInt(drawWidthInput.value) : 3;
    }
}

function draw(e) {
    if (!isDrawing || currentTool === 'move') return;
    const pos = getPointerPos(e);

    if (currentTool === 'freedraw' || currentTool === 'eraser') {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    } else if (currentTool === 'line') {
        ctx.putImageData(savedCanvasState, 0, 0);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = drawColorInput ? drawColorInput.value : '#ffffff';
        ctx.lineWidth = drawWidthInput ? parseInt(drawWidthInput.value) : 3;
        ctx.stroke();

        // Seta na ponta
        const angle = Math.atan2(pos.y - startY, pos.x - startX);
        const headlen = 10;
        ctx.lineTo(pos.x - headlen * Math.cos(angle - Math.PI / 6), pos.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - headlen * Math.cos(angle + Math.PI / 6), pos.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }
}

function stopDrawing() {
    isDrawing = false;
}

canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', (e) => {
    draw(e);
    if (currentTool === 'eraser') {
        const pitchRect = pitchJogadas.getBoundingClientRect();
        const mx = e.clientX;
        const my = e.clientY;
        if (mx >= pitchRect.left && mx <= pitchRect.right && my >= pitchRect.top && my <= pitchRect.bottom) {
            const size = (drawWidthInput ? parseInt(drawWidthInput.value) : 3) * 5;
            eraserCursor.style.display = 'block';
            eraserCursor.style.left = mx + 'px';
            eraserCursor.style.top = my + 'px';
            eraserCursor.style.width = size + 'px';
            eraserCursor.style.height = size + 'px';
        } else {
            eraserCursor.style.display = 'none';
        }
    }
});
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointerleave', () => {
    stopDrawing();
    if (currentTool === 'eraser') {
        eraserCursor.style.display = 'none';
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
}, { passive: false });


// ===================== PEÇAS =====================
function createToken(type, text = '', subtext = '') {
    const token = document.createElement('div');
    token.className = 'token';

    if (type === 'player') {
        token.classList.add('token-player');
        token.innerText = text;
        if (subtext) {
            const nameEl = document.createElement('div');
            nameEl.className = 'token-name';
            nameEl.innerText = subtext;
            token.appendChild(nameEl);
        }
    } else if (type === 'opponent') {
        token.classList.add('token-opponent');
    } else if (type === 'ball') {
        token.classList.add('token-ball');
        token.innerText = '⚽';
    }

    token.addEventListener('pointerdown', (e) => {
        startTokenDrag(token, e);
    });

    return token;
}

function startTokenDrag(token, e) {
    if (currentTool !== 'move') return;
    if (token.classList.contains('token-bench')) return;

    e.stopPropagation();
    e.preventDefault();

    const startRect = token.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const offsetX = clientX - startRect.left;
    const offsetY = clientY - startRect.top;

    // Descobre qual é o banco correto dessa peça
    let targetBench = null;
    if (token.classList.contains('token-player')) targetBench = document.getElementById('my-team-bench');
    else if (token.classList.contains('token-opponent')) targetBench = document.getElementById('opponent-box');

    // Calcula a "Zona Segura" (Campo + Banco)
    const pitchRect = pitchJogadas.getBoundingClientRect();
    let minX = pitchRect.left;
    let maxX = pitchRect.right;
    let minY = pitchRect.top;
    let maxY = pitchRect.bottom;

    if (targetBench) {
        const benchRect = targetBench.getBoundingClientRect();
        minX = Math.min(minX, benchRect.left);
        maxX = Math.max(maxX, benchRect.right);
        minY = Math.min(minY, benchRect.top);
        maxY = Math.max(maxY, benchRect.bottom);
    }

    document.body.appendChild(token);
    token.style.position = 'fixed';
    token.style.zIndex = '99999';
    token.style.margin = '0';
    token.style.transform = 'none';
    
    token.style.left = (clientX - offsetX) + 'px';
    token.style.top = (clientY - offsetY) + 'px';

    function onPointerMove(moveEvent) {
        moveEvent.preventDefault();
        let mClientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
        let mClientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

        // TRAVA: Impede que o ponteiro "puxe" a peça para fora da zona segura
        mClientX = Math.max(minX, Math.min(maxX, mClientX));
        mClientY = Math.max(minY, Math.min(maxY, mClientY));

        token.style.left = (mClientX - offsetX) + 'px';
        token.style.top = (mClientY - offsetY) + 'px';
    }

    function onPointerUp(upEvent) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerUp);

        let dropX = upEvent.changedTouches ? upEvent.changedTouches[0].clientX : upEvent.clientX;
        let dropY = upEvent.changedTouches ? upEvent.changedTouches[0].clientY : upEvent.clientY;

        // Aplica a mesma trava no momento de soltar
        dropX = Math.max(minX, Math.min(maxX, dropX));
        dropY = Math.max(minY, Math.min(maxY, dropY));

        let droppedOnBench = false;

        // 1. Caiu no Banco?
        if (targetBench) {
            const benchRect = targetBench.getBoundingClientRect();
            if (dropX >= benchRect.left && dropX <= benchRect.right && dropY >= benchRect.top && dropY <= benchRect.bottom) {
                
                droppedOnBench = true;
                const firstRect = token.getBoundingClientRect();
                
                targetBench.appendChild(token);
                token.style.position = '';
                token.style.left = '';
                token.style.top = '';
                token.style.transform = '';
                token.style.zIndex = '';
                token.classList.add('token-bench');
                
                const lastRect = token.getBoundingClientRect();
                token.animate([
                    { transform: `translate(${firstRect.left - lastRect.left}px, ${firstRect.top - lastRect.top}px)` },
                    { transform: 'translate(0, 0)' }
                ], { duration: 250, easing: 'ease-out' });
                
                setupBenchTokenDrag(token);
            }
        }

        // 2. Caiu no Campo
        if (!droppedOnBench) {
            const tokenRect = token.getBoundingClientRect();
            
            let centerX = tokenRect.left + tokenRect.width / 2;
            let centerY = tokenRect.top + tokenRect.height / 2;
            
            centerX = Math.max(pitchRect.left, Math.min(pitchRect.right, centerX));
            centerY = Math.max(pitchRect.top, Math.min(pitchRect.bottom, centerY));
            
            pitchJogadas.appendChild(token);
            token.style.position = 'absolute';
            token.style.left = ((centerX - pitchRect.left) / pitchRect.width * 100) + '%';
            token.style.top = ((centerY - pitchRect.top) / pitchRect.height * 100) + '%';
            token.style.transform = 'translate(-50%, -50%)';
            token.style.zIndex = '';
        }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
}

// ===================== ARRASTAR DO BANCO PARA O CAMPO =====================
function setupBenchTokenDrag(token) {
    token.addEventListener('pointerdown', function onFirstDrag(e) {
        if (currentTool !== 'move') toolMoveBtn.click();
        
        let isDragging = false;
        const startRect = token.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const offsetX = clientX - startRect.left;
        const offsetY = clientY - startRect.top;

        // Descobre qual é o banco correto e calcula a Zona Segura
        let targetBench = null;
        if (token.classList.contains('token-player')) targetBench = document.getElementById('my-team-bench');
        else if (token.classList.contains('token-opponent')) targetBench = document.getElementById('opponent-box');

        const pitchRect = pitchJogadas.getBoundingClientRect();
        let minX = pitchRect.left;
        let maxX = pitchRect.right;
        let minY = pitchRect.top;
        let maxY = pitchRect.bottom;

        if (targetBench) {
            const benchRect = targetBench.getBoundingClientRect();
            minX = Math.min(minX, benchRect.left);
            maxX = Math.max(maxX, benchRect.right);
            minY = Math.min(minY, benchRect.top);
            maxY = Math.max(maxY, benchRect.bottom);
        }

        function onPointerMove(moveEvent) {
            moveEvent.preventDefault();
            
            if (!isDragging) {
                isDragging = true;
                
                document.body.appendChild(token);
                token.style.position = 'fixed';
                token.style.zIndex = '99999';
                token.style.margin = '0';
                token.style.transform = 'none';
                token.classList.remove('token-bench'); 
                
                token.removeEventListener('pointerdown', onFirstDrag);
            }

            let mClientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            let mClientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            // TRAVA: Impede que o ponteiro "puxe" a peça para fora da zona segura
            mClientX = Math.max(minX, Math.min(maxX, mClientX));
            mClientY = Math.max(minY, Math.min(maxY, mClientY));

            token.style.left = (mClientX - offsetX) + 'px';
            token.style.top = (mClientY - offsetY) + 'px';
        }

        function onPointerUp(upEvent) {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('touchmove', onPointerMove);
            window.removeEventListener('touchend', onPointerUp);
            
            if (isDragging) {
                let dropX = upEvent.changedTouches ? upEvent.changedTouches[0].clientX : upEvent.clientX;
                let dropY = upEvent.changedTouches ? upEvent.changedTouches[0].clientY : upEvent.clientY;

                // Aplica a mesma trava no momento de soltar
                dropX = Math.max(minX, Math.min(maxX, dropX));
                dropY = Math.max(minY, Math.min(maxY, dropY));

                let droppedOnBench = false;

                if (targetBench) {
                    const benchRect = targetBench.getBoundingClientRect();
                    if (dropX >= benchRect.left && dropX <= benchRect.right && dropY >= benchRect.top && dropY <= benchRect.bottom) {
                        
                        droppedOnBench = true;
                        const firstRect = token.getBoundingClientRect();
                        
                        targetBench.appendChild(token);
                        token.style.position = '';
                        token.style.left = '';
                        token.style.top = '';
                        token.style.transform = '';
                        token.style.zIndex = '';
                        token.classList.add('token-bench');
                        
                        const lastRect = token.getBoundingClientRect();
                        token.animate([
                            { transform: `translate(${firstRect.left - lastRect.left}px, ${firstRect.top - lastRect.top}px)` },
                            { transform: 'translate(0, 0)' }
                        ], { duration: 250, easing: 'ease-out' });
                        
                        setupBenchTokenDrag(token);
                    }
                }

                if (!droppedOnBench) {
                    const tokenRect = token.getBoundingClientRect();
                    
                    let centerX = tokenRect.left + tokenRect.width / 2;
                    let centerY = tokenRect.top + tokenRect.height / 2;
                    
                    centerX = Math.max(pitchRect.left, Math.min(pitchRect.right, centerX));
                    centerY = Math.max(pitchRect.top, Math.min(pitchRect.bottom, centerY));
                    
                    pitchJogadas.appendChild(token);
                    token.style.position = 'absolute';
                    token.style.left = ((centerX - pitchRect.left) / pitchRect.width * 100) + '%';
                    token.style.top = ((centerY - pitchRect.top) / pitchRect.height * 100) + '%';
                    token.style.transform = 'translate(-50%, -50%)';
                    token.style.zIndex = '';
                    
                    token.addEventListener('pointerdown', (ev) => startTokenDrag(token, ev));
                }
            }
        }

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);
    });
}


// ===================== ADVERSÁRIOS =====================
function populateOpponentBox() {
    const label = opponentBox.querySelector('.bench-label');
    opponentBox.innerHTML = '';
    if (label) opponentBox.appendChild(label);
    
    for (let i = 0; i < 7; i++) {
        const opp = createToken('opponent');
        opp.innerText = i + 1;
        opp.classList.add('token-bench'); // Usa o CSS!
        
        setupBenchTokenDrag(opp);
        opponentBox.appendChild(opp);
    }
}
populateOpponentBox();

function resetOpponents() {
    const opps = pitchJogadas.querySelectorAll('.token-opponent');
    opps.forEach(o => o.remove());
    populateOpponentBox();
}

const resetOpponentsBtn = document.getElementById('reset-opponents');
if (resetOpponentsBtn) {
    resetOpponentsBtn.addEventListener('click', resetOpponents);
}

// ===================== INICIAR/CARREGAR JOGADORES =====================
function initJogadas() {
    // Garantir que o canvas tem o tamanho correto
    setTimeout(resizeCanvas, 50);

    const saved = localStorage.getItem('squadState');
    if (!saved) return;
    const state = JSON.parse(saved);

    const isTacticChanged = (state.tactic !== lastTactic);
    lastTactic = state.tactic;

    // Limpar os jogadores antigos do campo
    const oldPlayers = pitchJogadas.querySelectorAll('.token-player');
    oldPlayers.forEach(p => p.remove());

    const placedOriginalIds = new Set(); // Controle para evitar jogadores duplicados em campo

    // Posicionar titulares no campo
    state.slots.forEach(slotData => {
        if (slotData.players && slotData.players.length > 0) {
            const titularId = slotData.players[0].id;
            
            // Se já foi escalado em campo, ignora para não duplicar
            if (placedOriginalIds.has(titularId)) {
                return;
            }
            placedOriginalIds.add(titularId);

            const originalEl = document.getElementById(titularId);
            if (originalEl) {
                const textRaw = originalEl.innerText;
                let num = '';
                let name = textRaw;
                if (textRaw.includes('#')) {
                    const parts = textRaw.split('#');
                    name = parts[0].trim();
                    num = parts[1].trim();
                } else {
                    num = name.substring(0, 1);
                }

                const slotKey = slotData.id.replace('slot-', '');
                let token = createToken('player', num, name);
                token.dataset.slot = slotKey;
                token.dataset.originalId = titularId;

                let oldX = parseFloat(slotData.left);
                let oldY = parseFloat(slotData.bottom);

                // Rotação vertical→horizontal
                let newLeft = oldY;
                let newTop = oldX;

                token.style.left = newLeft + '%';
                token.style.top = newTop + '%';

                pitchJogadas.appendChild(token);
            }
        }
    });

    // Bola
    if (!pitchJogadas.querySelector('.token-ball')) {
        const ball = createToken('ball');
        ball.style.left = '50%';
        ball.style.top = '50%';
        pitchJogadas.appendChild(ball);
    }

    // Popular banco do meu time com os reservas não escalados
    const myTeamBench = document.getElementById('my-team-bench');
    const myLabel = myTeamBench.querySelector('.bench-label');
    myTeamBench.innerHTML = '';
    if (myLabel) myTeamBench.appendChild(myLabel);

    const allOriginalPlayers = document.querySelectorAll('#bench-list .player');
    allOriginalPlayers.forEach(p => {
        const pId = p.dataset.originalId || p.id;
        
        // Verifica se o jogador já está em campo pelo Set de controle
        if (!placedOriginalIds.has(pId)) {
            const textRaw = p.innerText;
            let num = '';
            let name = textRaw;
            if (textRaw.includes('#')) {
                const parts = textRaw.split('#');
                name = parts[0].trim();
                num = parts[1].trim();
            } else {
                num = name.substring(0, 1);
            }

            const benchToken = createToken('player', num, name);
            benchToken.dataset.originalId = pId;
            benchToken.classList.add('token-bench'); // Usa o CSS!

            // Chama a função modularizada
            setupBenchTokenDrag(benchToken);
            myTeamBench.appendChild(benchToken);
        }
    });
}

// Dispara na troca de aba
window.addEventListener('loadJogadas', initJogadas);

// Dispara ao clicar no botão de resetar o time
const resetTeamPlayersBtn = document.getElementById('reset-team-players');
if (resetTeamPlayersBtn) {
    resetTeamPlayersBtn.addEventListener('click', initJogadas);
}