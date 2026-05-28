/**
 * ==========================================================================
 * GERENCIADOR DE ESTADO GLOBAL (STATE)
 * ==========================================================================
 */
let combatentes = JSON.parse(localStorage.getItem('dm_combatentes')) || [];
let rodadaAtual = parseInt(localStorage.getItem('dm_rodada')) || 1;
let indexTurnoAtivo = parseInt(localStorage.getItem('dm_turno_index')) || 0;

// Elementos de Entrada do Formulário
const domNome = document.getElementById('nome');
const domIniciativa = document.getElementById('iniciativa');
const domHp = document.getElementById('hp');
const domLista = document.getElementById('listaCombate');
const domBtnAdicionar = document.getElementById('btnAdicionar');
const domNotas = document.getElementById('notasMestre');
const domContadorRodada = document.getElementById('contadorRodada');

// Inicialização assim que a página carrega
window.addEventListener('DOMContentLoaded', () => {
    if (domNotas) domNotas.value = localStorage.getItem('dm_notas') || '';
    atualizarContadorRodada();
    atualizarInterface();
});

// Salvar notas automaticamente ao digitar
if (domNotas) {
    domNotas.addEventListener('input', (e) => {
        localStorage.setItem('dm_notas', e.target.value);
    });
}

/**
 * ==========================================================================
 * MOTOR DE COMBATE & RODADAS (SISTEMA DE TURNOS)
 * ==========================================================================
 */
function cadastrarCombatente() {
    const nomeVal = domNome.value.trim();
    const iniciativaVal = parseInt(domIniciativa.value) || 0;
    const hpMaxVal = parseInt(domHp.value) || 10;

    if (!nomeVal) {
        domNome.focus();
        return;
    }

    const novoCombatente = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        nome: nomeVal,
        iniciativa: iniciativaVal,
        hpAtual: hpMaxVal,
        hpMax: hpMaxVal,
        condicoes: []
    };

    combatentes.push(novoCombatente);
    salvarEProcessar();
    
    // Limpa os campos e joga o foco de digitação de volta para o Nome
    domNome.value = ''; 
    domIniciativa.value = ''; 
    domHp.value = '';
    domNome.focus();
}

function proximaRodada() {
    if (combatentes.length === 0) return;
    
    indexTurnoAtivo++;
    
    // Se o turno passar do último combatente da lista, volta ao topo e avança a rodada
    if (indexTurnoAtivo >= combatentes.length) {
        indexTurnoAtivo = 0;
        rodadaAtual++;
        localStorage.setItem('dm_rodada', rodadaAtual);
        atualizarContadorRodada();
    }
    
    localStorage.setItem('dm_turno_index', indexTurnoAtivo);
    atualizarInterface();
}

function atualizarContadorRodada() {
    if (domContadorRodada) {
        domContadorRodada.innerText = `Rodada Ativa: ${rodadaAtual}`;
    }
}

/**
 * ==========================================================================
 * MECÂNICAS DE REGRAS (HP & CONDIÇÕES D&D)
 * ==========================================================================
 */
function alterarHP(id, valor) {
    combatentes = combatentes.map(c => {
        if (c.id === id) {
            let n = c.hpAtual + valor;
            if (n > c.hpMax) n = c.hpMax;
            return { ...c, hpAtual: n };
        }
        return c;
    });
    salvarEProcessar();
}

function adicionarCondicao(id, condicao) {
    if (!condicao) return;
    combatentes = combatentes.map(c => {
        if (c.id === id && !c.condicoes.includes(condicao)) {
            return { ...c, condicoes: [...c.condicoes, condicao] };
        }
        return c;
    });
    salvarEProcessar();
}

function removerCondicao(id, condicao) {
    combatentes = combatentes.map(c => {
        if (c.id === id) {
            return { ...c, condicoes: c.condicoes.filter(cond => cond !== condicao) };
        }
        return c;
    });
    salvarEProcessar();
}

function removerCombatente(id) {
    combatentes = combatentes.filter(c => c.id !== id);
    // Ajusta o índice do turno caso o personagem ativo seja deletado
    if (indexTurnoAtivo >= combatentes.length) {
        indexTurnoAtivo = Math.max(0, combatentes.length - 1);
    }
    salvarEProcessar();
}

function limparMesa() {
    if (confirm("Zerar a mesa? Isso resetará o combate e as rodadas.")) {
        combatentes = []; 
        rodadaAtual = 1; 
        indexTurnoAtivo = 0;
        localStorage.setItem('dm_rodada', 1); 
        localStorage.setItem('dm_turno_index', 0);
        atualizarContadorRodada(); 
        salvarEProcessar();
    }
}

function salvarEProcessar() {
    // Ordenação matemática de RPG: Maior iniciativa vai para o topo
    combatentes.sort((a, b) => b.iniciativa - a.iniciativa);
    localStorage.setItem('dm_combatentes', JSON.stringify(combatentes));
    atualizarInterface();
}

/**
 * ==========================================================================
 * UTILS INTERATIVOS (TORRE DE DADOS & GERADOR DE LOOT)
 * ==========================================================================
 */
function rolarDado(lados) {
    const resultado = Math.floor(Math.random() * lados) + 1;
    const display = document.getElementById('resultadoDado');
    
    if (display) {
        display.innerText = `Resultado d${lados}: [ ${resultado} ]`;
        
        // Se tirar 20 natural no d20: Crítico do Sistema!
        if (lados === 20 && resultado === 20) {
            display.innerHTML = `🔥 CRÍTICO NATURAL: [ 20 ]`;
            tocarSom('magia');
        }
    }
}

function gerarLoot() {
    const tier = document.getElementById('nivelMonstro').value;
    const caixa = document.getElementById('caixaTesouro');
    
    if (!caixa) return;

    // Fórmulas de dados simuladas para moedas
    const moedasCobre = Math.floor(Math.random() * 80) + 20;
    const moedasOuro = Math.floor(Math.random() * 25) + 5;
    
    const tabelas = {
        nd1: ["Poção de Cura (Menor)", "Pergaminho de Mísseis Mágicos", "Gema Ágata (10 po)", "Frasco de Ácido Alquímico"],
        nd5: ["Anel de Proteção +1", "Espada Curta de Ferro Frio", "Capa de Elvenkind", "Poção de Cura (Maior)"],
        nd11: ["Armadura de Placas +2", "Cajado do Magi", "Espada Flamejante Lengendária", "Anel de Invisibilidade"]
    };
    
    let listaFiltro = tabelas[tier] || tabelas['nd1'];
    let itemSorteado = listaFiltro[Math.floor(Math.random() * listaFiltro.length)];
    
    if (tier === "nd1") {
        caixa.innerHTML = `💰 <strong>Moedas:</strong> ${moedasCobre}pc, ${moedasOuro}po <br>🎒 <strong>Item:</strong> ${itemSorteado}`;
    } else if (tier === "nd5") {
        caixa.innerHTML = `💰 <strong>Moedas:</strong> ${(moedasOuro * 5)}po, 2pc <br>🎒 <strong>Item:</strong> ${itemSorteado}`;
    } else {
        caixa.innerHTML = `👑 <strong>Loot Épico:</strong> ${moedasOuro * 30}po, 3x Gemas de Diamante <br>🎒 <strong>Item:</strong> ${itemSorteado}`;
    }
    
    tocarSom('moedas');
}

/**
 * ==========================================================================
 * ENGINE DE SISTEMA DE ÁUDIO & CLIMA
 * ==========================================================================
 */
function tocarSom(id) {
    const audioEl = document.getElementById(`audio-${id}`);
    if (audioEl) {
        audioEl.currentTime = 0; 
        audioEl.play().catch(() => console.log("Áudio bloqueado pelo navegador até interação."));
    }
}

function mudarClima(idClima, botaoElemento) {
    // Pausa e reseta todos os loops de clima ativos
    ['chuva', 'caverna'].forEach(c => { 
        const a = document.getElementById(`audio-${c}`); 
        if (a) { a.pause(); a.currentTime = 0; } 
    });
    
    // Remove o indicador visual 'ativo' de todos os botões de clima
    document.querySelectorAll('.btn-clima').forEach(b => b.classList.remove('ativo'));
    
    // Se o mestre não clicou em limpar, liga o som e destaca o botão clicado
    if (idClima !== 'limpo') {
        const audioAtivo = document.getElementById(`audio-${idClima}`);
        if (audioAtivo) {
            audioAtivo.play().catch(() => {});
            if (botaoElemento) botaoElemento.classList.add('ativo');
        }
    }
}

/**
 * ==========================================================================
 * RENDEREZAÇÃO DA CAMADA DE VISUALIZAÇÃO (UI)
 * ==========================================================================
 */
function atualizarInterface() {
    if (!domLista) return;
    domLista.innerHTML = '';

    combatentes.forEach((c, index) => {
        const keywordsInimigos = ['orc', 'goblin', 'dragao', 'dragão', 'zumbi', 'monstro', 'esqueleto', 'boss', 'lich'];
        const ehMonstro = keywordsInimigos.some(k => c.nome.toLowerCase().includes(k));
        
        let classeCard = ehMonstro ? 'card-personagem monstro' : 'card-personagem';
        if (c.hpAtual <= 0) classeCard += ' morto';
        
        // Adiciona a borda roxa brilhante se for o turno ATUAL deste personagem
        if (index === indexTurnoAtivo && combatentes.length > 0) {
            classeCard += ' ativo-turno';
        }

        // Gera as tags de condições ativas no card
        let badgesHtml = c.condicoes.map(cond => `
            <span class="badge-condicao" onclick="removerCondicao('${c.id}', '${cond}')">${cond} ✕</span>
        `).join('');

        const htmlCard = `
            <article class="${classeCard}">
                <div>
                    <h3 style="display:inline-block; font-size:1.1rem; font-weight:600;">${c.nome}</h3>
                    <p style="color:var(--text-dark); font-size:0.8rem">Iniciativa: <strong>${c.iniciativa}</strong></p>
                    <div style="margin-top: 5px;">${badgesHtml}</div>
                    
                    <select class="select-condicao" onchange="adicionarCondicao('${c.id}', this.value); this.value=''">
                        <option value="">+ Condição</option>
                        <option value="Caído">💤 Caído</option>
                        <option value="Cego">👁️ Cego</option>
                        <option value="Envenenado">🤢 Envenenado</option>
                        <option value="Invisível">👻 Invisível</option>
                        <option value="Atordoado">🌀 Atordoado</option>
                    </select>
                </div>
                <div class="controles-hp">
                    <button class="btn-hp minus" onclick="alterarHP('${c.id}', -5)">-5</button>
                    <button class="btn-hp minus" onclick="alterarHP('${c.id}', -1)">-1</button>
                    <span class="hp-display">${c.hpAtual} / ${c.hpMax} HP</span>
                    <button class="btn-hp plus" onclick="alterarHP('${c.id}', 1)">+1</button>
                    <button class="btn-hp plus" onclick="alterarHP('${c.id}', 5)">+5</button>
                    <button class="btn-danger-outline" style="padding:4px 8px; margin-left:8px;" onclick="removerCombatente('${c.id}')">✕</button>
                </div>
            </article>
        `;
        domLista.insertAdjacentHTML('beforeend', htmlCard);
    });
}

/**
 * ==========================================================================
 * ASSINATURA DE EVENTOS DO NAVEGADOR
 * ==========================================================================
 */
if (domBtnAdicionar) domBtnAdicionar.addEventListener('click', cadastrarCombatente);

[domNome, domIniciativa, domHp].forEach(inputElement => {
    if (inputElement) {
        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') cadastrarCombatente();
        });
    }
});
