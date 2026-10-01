const campoTarefa = document.getElementById('campo-tarefa');
const botaoAdicionar = document.getElementById('botao-adicionar');
const listaTarefas = document.getElementById('lista-tarefas');
const contadorTarefas = document.getElementById('contador-tarefas');
const botaoTema = document.getElementById('botao-tema');

function atualizarContador() {

    const total = listaTarefas.children.length;
    if (total === 0) contadorTarefas.textContent = '0 Tarefas na lista';
    else if (total === 1) contadorTarefas.textContent = '1 Tarefa na lista';
    else contadorTarefas.textContent = `${total} Tarefas na lista`;

}

function adicionarTarefa() {

    const textoTarefa = campoTarefa.value.trim();
    if (textoTarefa === '') return;

    const itemLista = document.createElement('li');
    itemLista.classList.add('item-tarefa');
    itemLista.innerHTML = `
        <span>${textoTarefa}</span>
        <div class="acoes-tarefa">
            <button class="botao-acao concluir"><i class="fa-solid fa-check"></i></button>
            <button class="botao-acao excluir"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;

    const botaoConcluir = itemLista.querySelector('.concluir');
    botaoConcluir.addEventListener('click', () => {

        itemLista.classList.toggle('concluida');

    });

    const botaoExcluir = itemLista.querySelector('.excluir');
    botaoExcluir.addEventListener('click', () => {

        itemLista.remove();
        atualizarContador();

    });

    listaTarefas.appendChild(itemLista);
    campoTarefa.value = '';
    campoTarefa.focus();
    atualizarContador();

}

botaoAdicionar.addEventListener('click', adicionarTarefa);
campoTarefa.addEventListener('keypress', (e) => {

    if (e.key === 'Enter') adicionarTarefa();

});

botaoTema.addEventListener('click', () => {

    document.body.classList.toggle('modo-escuro');
    const icone = botaoTema.querySelector('i');
    icone.className = document.body.classList.contains('modo-escuro') 
        ? 'fa-solid fa-sun' 
        : 'fa-solid fa-moon';
        
});