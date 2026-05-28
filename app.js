/**
 * GERENCIADOR DE ESTADO DA APLICAÇÃO (STATE MANAGEMENT)
 */
let combatentes = [];

// Elementos mapeados do DOM
const domNome = document.getElementById('nome');
const domIniciativa = document.getElementById('iniciativa');
const domHp = document.getElementById('hp');
const domLista = document.getElementById('listaCombate');
const domBtnAdicionar = document.getElementById('btnAdicionar');

/**
 * ADICIONAR NOVO COMBATENTE
 */
function cadastrarCombatente() {
    const nome = domNome.value.trim();
    const iniciativa = parseInt(domIniciativa.value) || 0;
    const hpMax = parseInt(domHp.value) || 10;

    // Validação básica de entrada
    if (!nome) {
        domNome.focus();
        return;
    }

    const novoCombatente = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        nome: nome,
        iniciativa: iniciativa,
        hpAtual: hpMax,
        hpMax: hpMax
    };

    combatentes.push(novoCombatente);
    ordenarPorIniciativa();
    limparFormulario();
    atualizarInterface();
}

/**
 * MODIFICAR PONTOS DE VIDA (DANOS E CURAS)
 */
function alterarHP(id, modificador) {
    combatentes = combatentes.map(c => {
        if (c.id === id) {
            let novoHp = c.hpAtual + modificador;
            
            // Regra de Negócio: HP não pode passar do máximo definido
            if (novoHp > c.hpMax) novoHp = c.hpMax;
            
            return { ...c, hpAtual: novoHp };
        }
        return c;
    });
    atualizarInterface();
}

/**
 * REMOVER CRIATURA DO TRACKER
 */
function removerCombatente(id) {
    combatentes = combatentes.filter(c => c.id !== id);
    atualizarInterface();
}

/**
 * REGRAS DE AUXÍLIO/ORDENAÇÃO
 */
function ordenarPorIniciativa() {
    // Ordem decrescente: maior iniciativa joga primeiro
    combatentes.sort((a, b) => b.iniciativa - a.iniciativa);
}

function limparFormulario() {
    domNome.value = '';
    domIniciativa.value = '';
    domHp.value = '';
    domNome.focus();
}

/**
 * ATUALIZAÇÃO DA CAMADA DE VISUALIZAÇÃO (UI RENDERING)
 */
function atualizarInterface() {
    domLista.innerHTML = '';

    combatentes.forEach(c => {
        // Regra léxica básica para detectar monstros comuns de RPG automaticamente
        const monstrosComuns = ['orc', 'goblin', 'dragao', 'dragão', 'esqueleto', 'zumbi', 'monstro'];
        const ehMonstro = monstrosComuns.some(m => c.nome.toLowerCase().includes(m));
        
        const classeCard = ehMonstro ? 'card-personagem monstro' : 'card-personagem';

        const itemHtml = `
            <article class="${classeCard}">
                <div>
                    <h3 class="info-nome">${c.nome}</h3>
                    <p class="info-meta">Iniciativa: <strong>${c.iniciativa}</strong></p>
                </div>
                
                <div class="controles-hp">
                    <button class="btn-hp dano" onclick="alterarHP('${c.id}', -5)" title="Dar 5 de Dano">-5</button>
                    <button class="btn-hp dano" onclick="alterarHP('${c.id}', -1)" title="Dar 1 de Dano">-1</button>
                    
                    <span class="hp-display">${c.hpAtual} / ${c.hpMax} HP</span>
                    
                    <button class="btn-hp cura" onclick="alterarHP('${c.id}', 1)" title="Curar 1 de Vida">+1</button>
                    <button class="btn-hp cura" onclick="alterarHP('${c.id}', 5)" title="Curar 5 de Vida">+5</button>
                    
                    <button class="btn-remover" onclick="removerCombatente('${c.id}')" title="Remover combatente">✕</button>
                </div>
            </article>
        `;
        domLista.insertAdjacentHTML('beforeend', itemHtml);
    });
}

/**
 * GATILHOS DE EVENTO (LISTENERS)
 */
domBtnAdicionar.addEventListener('click', cadastrarCombatente);

// Atalho de teclado: pressionar Enter dentro dos inputs aciona o cadastro
[domNome, domIniciativa, domHp].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') cadastrarCombatente();
    });
});
