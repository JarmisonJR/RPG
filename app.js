// ESTADO DO APLICATIVO (STATE)
let combatentes = JSON.parse(localStorage.getItem('combatentes_rpg')) || [];

// MAPEAMENTO DO DOM
const domNome = document.getElementById('nome');
const domIniciativa = document.getElementById('iniciativa');
const domHp = document.getElementById('hp');
const domLista = document.getElementById('listaCombate');
const domBtnAdicionar = document.getElementById('btnAdicionar');
const domNotas = document.getElementById('notasMestre');

// INICIALIZADOR DA SESSÃO
window.addEventListener('DOMContentLoaded', () => {
    // Recuperar notas salvas do LocalStorage
    domNotas.value = localStorage.getItem('notas_mestre_rpg') || '';
    atualizarInterface();
});

// ESCUTADOR DE NOTAS DO MESTRE (SALVAMENTO ASSÍNCRONO)
domNotas.addEventListener('input', (e) => {
    localStorage.setItem('notas_mestre_rpg', e.target.value);
});

// INSERIR COMBATENTE
function cadastrarCombatente() {
    const nome = domNome.value.trim();
    const iniciativa = parseInt(domIniciativa.value) || 0;
    const hpMax = parseInt(domHp.value) || 10;

    if (!nome) return domNome.focus();

    const novo = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        nome,
        iniciativa,
        hpAtual: hpMax,
        hpMax
    };

    combatentes.push(novo);
    salvarERenderizar();
    
    // Limpar campos de entrada
    domNome.value = ''; domIniciativa.value = ''; domHp.value = '';
    domNome.focus();
}

// ALTERAR ENERGIA / PONTOS DE VIDA
function alterarHP(id, valor) {
    combatentes = combatentes.map(c => {
        if (c.id === id) {
            let novoHp = c.hpAtual + valor;
            if (novoHp > c.hpMax) novoHp = c.hpMax;
            return { ...c, hpAtual: novoHp };
        }
        return c;
    });
    salvarERenderizar();
}

function removerCombatente(id) {
    combatentes = combatentes.filter(c => c.id !== id);
    salvarERenderizar();
}

function limparMesa() {
    if(confirm("Deseja mesmo limpar todos os monstros e jogadores da mesa ativa?")) {
        combatentes = [];
        salvarERenderizar();
    }
}

function salvarERenderizar() {
    // Ordenar por iniciativa (Regra oficial: maior valor age primeiro)
    combatentes.sort((a, b) => b.iniciativa - a.iniciativa);
    // Persistir dados
    localStorage.setItem('combatentes_rpg', JSON.stringify(combatentes));
    atualizarInterface();
}

// ATUALIZAR INTERFACE GRÁFICA
function atualizarInterface() {
    domLista.innerHTML = '';

    combatentes.forEach(c => {
        const inimigosKeywords = ['orc', 'goblin', 'dragao', 'zumbi', 'esqueleto', 'monstro', 'boss', 'vilao'];
        const ehMonstro = inimigosKeywords.some(k => c.nome.toLowerCase().includes(k));
        
        let classeCard = ehMonstro ? 'card-personagem monstro' : 'card-personagem';
        if(c.hpAtual <= 0) classeCard += ' morto'; // Efeito de esmaecimento ao morrer

        const html = `
            <article class="${classeCard}">
                <div>
                    <h3 style="font-size:1.1rem; font-weight:600;">${c.nome}</h3>
                    <p style="color:var(--text-muted); font-size:0.85rem; margin-top:2px;">Iniciativa: <strong>${c.iniciativa}</strong></p>
                </div>
                <div class="controles-hp">
                    <button class="btn-hp minus" onclick="alterarHP('${c.id}', -5)">-5</button>
                    <button class="btn-hp minus" onclick="alterarHP('${c.id}', -1)">-1</button>
                    <span class="hp-display">${c.hpAtual} / ${c.hpMax} HP</span>
                    <button class="btn-hp plus" onclick="alterarHP('${c.id}', 1)">+1</button>
                    <button class="btn-hp plus" onclick="alterarHP('${c.id}', 5)">+5</button>
                    <button class="btn-danger-outline" style="padding:4px 8px; margin-left:10px; font-size:0.8rem;" onclick="removerCombatente('${c.id}')">✕</button>
                </div>
            </article>
        `;
        domLista.insertAdjacentHTML('beforeend', html);
    });
}

// ENGINE DE ÁUDIO DO SOUNDBOARD
function tocarSom(idEfeito) {
    const audio = document.getElementById(`audio-${idEfeito}`);
    if(audio) {
        audio.currentTime = 0; // Reinicia o som caso clique várias vezes seguidas
        audio.play().catch(e => console.log("Interação prévia do usuário necessária para som."));
    }
}

function mudarClima(idClima) {
    // Parar todos os loops de clima ativos primeiro
    const climas = ['chuva', 'caverna'];
    climas.forEach(c => {
        const a = document.getElementById(`audio-${c}`);
        if(a) { a.pause(); a.currentTime = 0; }
    });

    // Remover estado ativo visual dos botões
    document.querySelectorAll('.btn-clima').forEach(b => b.classList.remove('ativo'));

    if (idClima !== 'limpo') {
        const audioAtivo = document.getElementById(`audio-${idClima}`);
        if (audioAtivo) {
            audioAtivo.play();
            event.target.classList.add('ativo');
        }
    }
}

// CAPTURA DE EVENTOS DE ENTRADA
domBtnAdicionar.addEventListener('click', cadastrarCombatente);
[domNome, domIniciativa, domHp].forEach(i => i.addEventListener('keypress', e => { if(e.key === 'Enter') cadastrarCombatente(); }));
