// ESTADO GERAL DA MESA (PERSISTIDO)
let combatentes = JSON.parse(localStorage.getItem('dm_combatentes')) || [];
let rodadaAtual = parseInt(localStorage.getItem('dm_rodada')) || 1;
let indexTurnoAtivo = parseInt(localStorage.getItem('dm_turno_index')) || 0;

const domNome = document.getElementById('nome');
const domIniciativa = document.getElementById('iniciativa');
const domHp = document.getElementById('hp');
const domLista = document.getElementById('listaCombate');
const domBtnAdicionar = document.getElementById('btnAdicionar');
const domNotas = document.getElementById('notasMestre');
const domContadorRodada = document.getElementById('contadorRodada');

window.addEventListener('DOMContentLoaded', () => {
    domNotas.value = localStorage.getItem('dm_notas') || '';
    atualizarContadorRodada();
    atualizarInterface();
});

domNotas.addEventListener('input', (e) => localStorage.setItem('dm_notas', e.target.value));

function cadastrarCombatente() {
    const nome = domNome.value.trim();
    const iniciativa = parseInt(domIniciativa.value) || 0;
    const hpMax = parseInt(domHp.value) || 10;

    if (!nome) return domNome.focus();

    combatentes.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        nome,
        iniciativa,
        hpAtual: hpMax,
        hpMax,
        condicoes: [] // Novo array para guardar envenenado, caído, etc.
    });

    salvarEProcessar();
    domNome.value = ''; domIniciativa.value = ''; domHp.value = '';
    domNome.focus();
}

// NOVO: CONTROLE DE RODADAS INTELECTUAL (ESTILO VTT)
function proximaRodada() {
    if (combatentes.length === 0) return;
    
    indexTurnoAtivo++;
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
    domContadorRodada.innerText = `Rodada Ativa: ${rodadaAtual}`;
}

// NOVO: APLICAÇÃO DE CONDIÇÕES DO D&D 5E
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

// NOVO: MOTOR DE ENGENHARIA DE DADOS VIRTUAL
function rolarDado(lados) {
    const resultado = Math.floor(Math.random() * lados) + 1;
    const display = document.getElementById('resultadoDado');
    
    display.innerText = `Resultado d${lados}: [ ${resultado} ]`;
    
    // Efeito Crítico visual/auditivo se tirar 20 no d20
    if (lados === 20 && resultado === 20) {
        display.innerHTML = `🔥 CRÍTICO: [ 20 ]`;
        tocarSom('magia');
    }
}

// NOVO: GERADOR DE LOOT (TESOURO) REALISTA POR ND
function gerarLoot() {
    const tier = document.getElementById('nivelMonstro').value;
    const caixa = document.getElementById('caixaTesouro');
    
    const moedasCobre = Math.floor(Math.random() * 100) + 20;
    const moedasOuro = Math.floor(Math.random() * 30) + 5;
    
    const itensComuns = ["Poção de Cura Menor", "Pergaminho de Mísseis Mágicos", "Gema polida (10 po)", "Antídoto de Ervas"];
    const itensRaros = ["Anel de Proteção +1", "Espada Curta Flamejante", "Capa de Elvenkind", "Poção de Cura Maior"];
    
    let itemSorteado = "";
    
    if (tier === "nd1") {
        itemSorteado = itensComuns[Math.floor(Math.random() * itensComuns.length)];
        caixa.innerHTML = `💰 <strong>Moedas:</strong> ${moedasCobre}pc, ${moedasOuro}po <br>🎒 <strong>Item:</strong> ${itemSorteado}`;
    } else if (tier === "nd5") {
        itemSorteado = itensRaros[Math.floor(Math.random() * itensRaros.length)];
        caixa.innerHTML = `💰 <strong>Moedas:</strong> ${(moedasOuro * 4)}po <br>🎒 <strong>Item:</strong> ${itemSorteado}`;
    } else {
        caixa.innerHTML = `👑 <strong>Tesouro Lendário:</strong> 1x Artefato Mágico Antigo e ${moedasOuro * 20} moedas de Platina pura!`;
    }
    tocarSom('moedas');
}

function alterarHP(id, valor) {
    combatentes = combatentes.map(c => {
        if (c.id === id) {
            let n = c.hpAtual + valor;
            return { ...c, hpAtual: n > c.hpMax ? c.hpMax : n };
        }
        return c;
    });
    salvarEProcessar();
}

function removerCombatente(id) {
    combatentes = combatentes.filter(c => c.id !== id);
    if(indexTurnoAtivo >= combatentes.length) indexTurnoAtivo = 0;
    salvarEProcessar();
}

function limparMesa() {
    if(confirm("Zerar a mesa?")) {
        combatentes = []; rodadaAtual = 1; indexTurnoAtivo = 0;
        localStorage.setItem('dm_rodada', 1); localStorage.setItem('dm_turno_index', 0);
        atualizarContadorRodada(); salvarEProcessar();
    }
}

function salvarEProcessar() {
    // Mantém a regra de iniciativa decrescente
    combatentes.sort((a, b) => b.iniciativa - a.iniciativa);
    localStorage.setItem('dm_combatentes', JSON.stringify(combatentes));
    atualizarInterface();
}

function atualizarInterface() {
    domLista.innerHTML = '';

    combatentes.forEach((c, index) => {
        const inimigosKeywords = ['orc', 'goblin', 'dragao', 'zumbi', 'monstro', 'boss'];
        const ehMonstro = inimigosKeywords.some(k => c.nome.toLowerCase().includes(k));
        
        let classeCard = ehMonstro ? 'card-personagem monstro' : 'card-personagem';
        if(c.hpAtual <= 0) classeCard += ' morto';
        if(index === indexTurnoAtivo && combatentes.length > 0) classeCard += ' ativo-turno';

        // Renderizar Badges de Condições Aplicadas
        let badgesHtml = c.condicoes.map(cond => `
            <span class="badge-condicao" onclick="removerCondicao('${c.id}', '${cond}')">${cond} ✕</span>
        `).join('');

        const html = `
            <article class="${classeCard}">
                <div>
                    <h3 style="display:inline-block">${c.nome}</h3>
                    <p style="color:var(--text-dark); font-size:0.8rem">Iniciativa: <strong>${c.iniciativa}</strong></p>
                    <div class="container-badges">${badgesHtml}</div>
                    
                    <select class="select-condicao" onchange="adicionarCondicao('${c.id}', this.value); this.value=''">
                        <option value="">+ Condição</option>
                        <option value="Caído">💤 Caído</option>
                        <option value="Cego">👁️ Cego</option>
                        <option value="Envenenado">🤢 Envenenado</option>
                        <option value="Inconsciente">💀 Inconsciente</option>
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
        domLista.insertAdjacentHTML('beforeend', html);
    });
}

// AMBIENTAÇÃO AUDIOVISUAL
function tocarSom(id) {
    const a = document.getElementById(`audio-${id}`);
    if(a) { a.currentTime = 0; a.play().catch(() => {}); }
}

function mudarClima(id) {
    ['chuva', 'caverna'].forEach(c => { const a = document.getElementById(`audio-${c}`); if(a) a.pause(); });
    document.querySelectorAll('.btn-clima').forEach(b => b.classList.remove('ativo'));
    if(id !== 'limpo') { const active = document.getElementById(`audio-${id}`); if(active) { active.play(); event.target.classList.add('ativo'); } }
}

domBtnAdicionar.addEventListener('click', cadastrarCombatente);
[domNome, domIniciativa, domHp].forEach(i => i.addEventListener('keypress', e => { if(e.key === 'Enter') cadastrarCombatente(); }));
