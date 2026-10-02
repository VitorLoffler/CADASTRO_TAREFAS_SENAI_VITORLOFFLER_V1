const campoTarefa = document.getElementById('campo-tarefa');
const botaoAdicionar = document.getElementById('botao-adicionar');
const listaTarefas = document.getElementById('lista-tarefas');
const contadorTarefas = document.getElementById('contador-tarefas');
const botaoTema = document.getElementById('botao-tema');
const botaoExcluirTudo = document.getElementById('botao-excluir');
const botoesFiltro = document.querySelectorAll('.filtro-btn');
const campoPesquisa = document.getElementById('campo-pesquisa');
const seletorPrioridade = document.getElementById('seletor-prioridade');
const toastContainer = document.getElementById('toast-container');

let filtroAtual = 'todas';
let itemArrastado = null;
let backupDesfazer = null;
let timeoutToast = null;

function salvarTarefas() {
    const tarefas = [];
    document.querySelectorAll('#lista-tarefas .item-tarefa').forEach(item => {
        tarefas.push({
            texto: item.querySelector('.texto-tarefa').textContent,
            concluida: item.classList.contains('concluida'),
            prioridade: item.dataset.prioridade || 'media'
        });
    });
    localStorage.setItem('minhasTarefas', JSON.stringify(tarefas));
}

function carregarTarefas() {
    const salvas = JSON.parse(localStorage.getItem('minhasTarefas') || '[]');
    salvas.forEach(t => criarElementoTarefa(t.texto, t.concluida, t.prioridade));
}

function mostrarToast(mensagem, dadosParaDesfazer) {
    clearTimeout(timeoutToast);
    toastContainer.innerHTML = '';
    backupDesfazer = dadosParaDesfazer;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span>${mensagem}</span>
        <button id="btn-desfazer">Desfazer</button>
        <div class="barra-tempo"></div>
    `;
    toastContainer.appendChild(toast);

    document.getElementById('btn-desfazer').addEventListener('click', desfazerExclusao);

    timeoutToast = setTimeout(() => {
        toastContainer.innerHTML = '';
        backupDesfazer = null;
    }, 5000);
}

function desfazerExclusao() {
    if (!backupDesfazer) return;
    if (backupDesfazer.tipo === 'unica') {
        criarElementoTarefa(backupDesfazer.dados.texto, backupDesfazer.dados.concluida, backupDesfazer.dados.prioridade, backupDesfazer.indice);
    } else if (backupDesfazer.tipo === 'todas') {
        backupDesfazer.dados.forEach(t => criarElementoTarefa(t.texto, t.concluida, t.prioridade));
    }
    toastContainer.innerHTML = '';
    backupDesfazer = null;
    clearTimeout(timeoutToast);
    atualizarContador();
    salvarTarefas();
    aplicarFiltros();
}

function criarElementoTarefa(texto, concluida = false, prioridade = 'media', indice = null) {
    const itemLista = document.createElement('li');
    itemLista.classList.add('item-tarefa', `prioridade-${prioridade}`);
    itemLista.dataset.prioridade = prioridade;
    itemLista.draggable = true;
    if (concluida) itemLista.classList.add('concluida');

    itemLista.innerHTML = `
        <i class="fa-solid fa-grip-lines" style="color:#b2bec3; margin-right:8px;"></i>
        <span class="texto-tarefa">${texto}</span>
        <div class="acoes-tarefa">
            <button class="botao-acao concluir"><i class="fa-solid fa-check"></i></button>
            <button class="botao-acao editar"><i class="fa-solid fa-pencil"></i></button>
            <button class="botao-acao excluir"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;

    const spanTexto = itemLista.querySelector('.texto-tarefa');

    itemLista.addEventListener('dragstart', () => {
        itemArrastado = itemLista;
        setTimeout(() => itemLista.classList.add('arrastando'), 0);
    });
    itemLista.addEventListener('dragend', () => {
        itemLista.classList.remove('arrastando');
        itemArrastado = null;
        salvarTarefas();
    });

    itemLista.querySelector('.concluir').addEventListener('click', () => {
        itemLista.classList.toggle('concluida');
        salvarTarefas();
        aplicarFiltros();
    });

    itemLista.querySelector('.editar').addEventListener('click', () => {
        if (itemLista.classList.contains('editando')) return;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = spanTexto.textContent;
        input.className = 'input-edicao';
        itemLista.replaceChild(input, spanTexto);
        itemLista.classList.add('editando');
        input.focus();
        const salvar = () => {
            if (input.value.trim() !== '') spanTexto.textContent = input.value.trim();
            itemLista.replaceChild(spanTexto, input);
            itemLista.classList.remove('editando');
            salvarTarefas();
        };
        input.addEventListener('keypress', e => { if (e.key === 'Enter') salvar(); });
        input.addEventListener('blur', salvar);
    });

    itemLista.querySelector('.excluir').addEventListener('click', () => {
        const dados = {
            texto: spanTexto.textContent,
            concluida: itemLista.classList.contains('concluida'),
            prioridade: itemLista.dataset.prioridade
        };
        const indiceAtual = [...listaTarefas.children].indexOf(itemLista);
        itemLista.remove();
        atualizarContador();
        salvarTarefas();
        mostrarToast('Tarefa excluída', { tipo: 'unica', dados: dados, indice: indiceAtual });
    });

    if (indice !== null && indice < listaTarefas.children.length) {
        listaTarefas.insertBefore(itemLista, listaTarefas.children[indice]);
    } else {
        listaTarefas.appendChild(itemLista);
    }
}

function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('.item-tarefa:not(.arrastando)')];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else { return closest; }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

listaTarefas.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(listaTarefas, e.clientY);
    if (itemArrastado) {
        if (afterElement == null) listaTarefas.appendChild(itemArrastado);
        else listaTarefas.insertBefore(itemArrastado, afterElement);
    }
});

function atualizarContador() {
    const total = document.querySelectorAll('#lista-tarefas .item-tarefa').length;
    contadorTarefas.textContent = total === 1 ? '1 Tarefa na lista' : `${total} Tarefas na lista`;
}

function aplicarFiltros() {
    const termo = campoPesquisa ? campoPesquisa.value.toLowerCase() : '';
    document.querySelectorAll('#lista-tarefas .item-tarefa').forEach(t => {
        const texto = t.querySelector('.texto-tarefa').textContent.toLowerCase();
        const concluida = t.classList.contains('concluida');
        
        let passaFiltro = true;
        if (filtroAtual === 'pendentes' && concluida) passaFiltro = false;
        if (filtroAtual === 'concluidas' && !concluida) passaFiltro = false;
        
        let passaPesquisa = texto.includes(termo);
        
        t.style.display = (passaFiltro && passaPesquisa) ? 'flex' : 'none';
    });
}

function adicionarTarefa() {
    const texto = campoTarefa.value.trim();
    if (texto === '') return;
    const prioridade = seletorPrioridade ? seletorPrioridade.value : 'media';
    criarElementoTarefa(texto, false, prioridade);
    campoTarefa.value = '';
    campoTarefa.focus();
    atualizarContador();
    salvarTarefas();
    aplicarFiltros();
}

function excluirTodasTarefas() {
    if (listaTarefas.children.length === 0) return;
    const todas = [];
    document.querySelectorAll('#lista-tarefas .item-tarefa').forEach(item => {
        todas.push({
            texto: item.querySelector('.texto-tarefa').textContent,
            concluida: item.classList.contains('concluida'),
            prioridade: item.dataset.prioridade
        });
    });
    if (confirm('Tem certeza que deseja excluir TODAS as tarefas?')) {
        listaTarefas.innerHTML = '';
        atualizarContador();
        salvarTarefas();
        mostrarToast(`${todas.length} tarefas excluídas`, { tipo: 'todas', dados: todas });
    }
}

botoesFiltro.forEach(b => {
    b.addEventListener('click', () => {
        botoesFiltro.forEach(x => x.classList.remove('ativo'));
        b.classList.add('ativo');
        filtroAtual = b.dataset.filtro;
        aplicarFiltros();
    });
});

if(campoPesquisa) campoPesquisa.addEventListener('input', aplicarFiltros);
botaoAdicionar.addEventListener('click', adicionarTarefa);
campoTarefa.addEventListener('keypress', e => { if (e.key === 'Enter') adicionarTarefa(); });
botaoExcluirTudo.addEventListener('click', excluirTodasTarefas);

document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (backupDesfazer) {
            e.preventDefault();
            desfazerExclusao();
        }
    }
});

botaoTema.addEventListener('click', () => {
    document.body.classList.toggle('modo-escuro');
    botaoTema.querySelector('i').className = document.body.classList.contains('modo-escuro') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
});

// --- RF 45 - ORGANIZAR POR PRIORIDADE ---
const botaoOrganizar = document.getElementById('botao-organizar');

function organizarPorPrioridade() {
    const tarefas = [...listaTarefas.querySelectorAll('.item-tarefa')];
    
    if (tarefas.length < 2) return;

    const peso = { 'alta': 3, 'media': 2, 'baixa': 1 };

    tarefas.sort((a, b) => {
        // 1. Primeiro critério: prioridade (Alta no topo)
        const prioridadeA = peso[a.dataset.prioridade] || 0;
        const prioridadeB = peso[b.dataset.prioridade] || 0;
        
        if (prioridadeB !== prioridadeA) {
            return prioridadeB - prioridadeA;
        }
        // 2. Segundo critério: pendentes antes de concluídas
        const concluidaA = a.classList.contains('concluida') ? 1 : 0;
        const concluidaB = b.classList.contains('concluida') ? 1 : 0;
        return concluidaA - concluidaB;
    });

    // Animação de organização
    tarefas.forEach(item => {
        item.style.transform = 'scale(0.95)';
        item.style.opacity = '0.5';
    });

    setTimeout(() => {
        tarefas.forEach(item => listaTarefas.appendChild(item));
        tarefas.forEach(item => {
            item.style.transform = 'scale(1)';
            item.style.opacity = '1';
        });
        salvarTarefas();
    }, 200);
}

if (botaoOrganizar) {
    botaoOrganizar.addEventListener('click', organizarPorPrioridade);
}
// --- BOTÃO RFS AO LADO DA LUA - ALERT ---
const botaoRfs = document.getElementById('botao-rfs');

if (botaoRfs) {
    botaoRfs.addEventListener('click', () => {
        alert(
`✅ RFS IMPLEMENTADAS NO PROJETO:

✔ RF01 - Editar Tarefa
✔ RF02 - Filtros: Todas / Pendentes / Concluídas
✔ RF03 - Pesquisa em tempo real
✔ RF04 - Salvar no navegador (localStorage)
✔ RF05 - Prioridade por cor (Verde/Amarela/Vermelha)
✔ RF06 - Desfazer exclusão (Toast + Ctrl+Z)
✔ RF07 - Drag and Drop (Arrastar para ordenar)
✔ RF08 - Excluir Todas
✔ RF09 - Organizar meu dia(Ordena or prioridade as tarefas)

Total: 9 RFS - Desenvolvido por Vitor Marcelo Loffler`
        );
    });
}

carregarTarefas();
atualizarContador();
aplicarFiltros();