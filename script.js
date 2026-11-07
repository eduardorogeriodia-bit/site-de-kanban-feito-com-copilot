'use strict';

const STORAGE_KEY = 'fluxo-kanban-v1';
const COLUMNS = [
  { id: 'todo', name: 'A fazer', className: 'todo' },
  { id: 'progress', name: 'Em andamento', className: 'progress' },
  { id: 'done', name: 'Concluído', className: 'done' },
];
const PRIORITIES = { low: 'Baixa', medium: 'Média', high: 'Alta' };

const elements = {
  boardSelect: document.querySelector('#board-select'),
  boardTitle: document.querySelector('#page-title'),
  board: document.querySelector('#kanban-board'),
  totalCount: document.querySelector('#total-count'),
  saveStatus: document.querySelector('#save-status'),
  taskDialog: document.querySelector('#task-dialog'),
  taskForm: document.querySelector('#task-form'),
  taskDialogTitle: document.querySelector('#task-dialog-title'),
  boardDialog: document.querySelector('#board-dialog'),
  boardForm: document.querySelector('#board-form'),
  boardDialogTitle: document.querySelector('#board-dialog-title'),
  confirmDialog: document.querySelector('#confirm-dialog'),
  confirmForm: document.querySelector('#confirm-form'),
  confirmTitle: document.querySelector('#confirm-title'),
  confirmMessage: document.querySelector('#confirm-message'),
  toast: document.querySelector('#toast'),
};

let state = carregarEstado();
let taskBeingEdited = null;
let boardBeingEdited = false;
let pendingDelete = null;
let draggedTaskId = null;
let toastTimer;

function criarId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function criarQuadro(name) {
  return { id: criarId(), name, tasks: [] };
}

// Recupera os dados sem interromper a abertura do quadro se o armazenamento falhar.
function carregarEstado() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.boards) && parsed.boards.length > 0) {
        const boards = parsed.boards.filter((board) => (
          board && typeof board.id === 'string' && typeof board.name === 'string' && Array.isArray(board.tasks)
        ));
        if (boards.length > 0) {
          return { boards, activeBoardId: boards.some((board) => board.id === parsed.activeBoardId) ? parsed.activeBoardId : boards[0].id };
        }
      }
    }
  } catch (error) {
    console.error('Não foi possível carregar os dados salvos:', error);
  }
  const firstBoard = criarQuadro('Meu quadro');
  return { boards: [firstBoard], activeBoardId: firstBoard.id };
}

function salvarEstado() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    elements.saveStatus.textContent = 'Alterações salvas';
    elements.saveStatus.classList.remove('has-error');
  } catch (error) {
    console.error('Não foi possível salvar os dados:', error);
    elements.saveStatus.textContent = 'Não foi possível salvar';
    elements.saveStatus.classList.add('has-error');
    mostrarAviso('O armazenamento está indisponível. Mantenha esta aba aberta para não perder as alterações.');
  }
}

function obterQuadroAtual() {
  return state.boards.find((board) => board.id === state.activeBoardId) ?? state.boards[0];
}

function criarElemento(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function criarBotao(text, label, className, action, disabled = false) {
  const button = criarElemento('button', `card-action ${className}`, text);
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.title = label;
  button.dataset.action = action;
  button.disabled = disabled;
  return button;
}

function renderizar() {
  // Toda a interface é montada com elementos e texto, sem interpretar conteúdo como HTML.
  const board = obterQuadroAtual();
  if (!board) return;
  elements.boardTitle.textContent = board.name;
  elements.board.replaceChildren();
  atualizarSeletorDeQuadros();

  let total = 0;
  COLUMNS.forEach((column, columnIndex) => {
    const tasks = board.tasks.filter((task) => task.column === column.id);
    total += tasks.length;
    elements.board.append(criarColuna(column, columnIndex, tasks));
  });
  elements.totalCount.textContent = `${total} ${total === 1 ? 'atividade' : 'atividades'}`;
}

function atualizarSeletorDeQuadros() {
  const options = state.boards.map((board) => {
    const option = document.createElement('option');
    option.value = board.id;
    option.textContent = board.name;
    option.selected = board.id === state.activeBoardId;
    return option;
  });
  elements.boardSelect.replaceChildren(...options);
  const multipleBoards = state.boards.length > 1;
  document.querySelector('#rename-board').disabled = false;
  document.querySelector('#delete-board').disabled = !multipleBoards;
  document.querySelector('#delete-board').title = multipleBoards ? 'Excluir quadro' : 'O último quadro não pode ser excluído';
}

function criarColuna(column, columnIndex, tasks) {
  const section = criarElemento('section', 'kanban-column');
  section.dataset.column = column.id;
  section.setAttribute('aria-label', `Coluna ${column.name}`);

  const heading = criarElemento('div', 'column-heading');
  const titleWrap = criarElemento('div', 'column-title-wrap');
  const indicator = criarElemento('span', `column-indicator ${column.className}`);
  indicator.setAttribute('aria-hidden', 'true');
  const title = criarElemento('h2', 'column-title', column.name);
  const count = criarElemento('span', 'column-count', String(tasks.length));
  count.setAttribute('aria-label', `${tasks.length} atividades`);
  titleWrap.append(indicator, title, count);
  heading.append(titleWrap);

  const addButton = criarElemento('button', 'add-task', '+ Adicionar atividade');
  addButton.type = 'button';
  addButton.dataset.addTo = column.id;
  const taskList = criarElemento('div', 'task-list');
  taskList.dataset.dropColumn = column.id;
  if (tasks.length === 0) {
    taskList.append(criarElemento('p', 'empty-state', 'Nenhuma atividade por aqui'));
  } else {
    tasks.forEach((task) => taskList.append(criarCartao(task, columnIndex)));
  }
  section.append(heading, addButton, taskList);
  return section;
}

function criarCartao(task, columnIndex) {
  const card = criarElemento('article', 'task-card');
  card.dataset.taskId = task.id;
  card.dataset.priority = Object.hasOwn(PRIORITIES, task.priority) ? task.priority : 'medium';
  card.draggable = true;
  card.setAttribute('aria-label', `${task.title}, prioridade ${PRIORITIES[card.dataset.priority]}`);

  const title = criarElemento('h3', 'task-title', task.title);
  const description = criarElemento('p', 'task-description', task.description);
  const priority = criarElemento('span', 'priority-label', PRIORITIES[card.dataset.priority]);
  const actions = criarElemento('div', 'card-actions');
  actions.append(
    criarBotao('←', 'Mover para a coluna anterior', 'move-previous', 'previous', columnIndex === 0),
    criarBotao('→', 'Mover para a próxima coluna', 'move-next', 'next', columnIndex === COLUMNS.length - 1),
    criarBotao('✎', 'Editar atividade', 'edit', 'edit'),
    criarBotao('×', 'Excluir atividade', 'delete', 'delete'),
  );
  card.append(title, description, priority, actions);
  return card;
}

function abrirFormularioDeAtividade(columnId, task = null) {
  taskBeingEdited = task?.id ?? null;
  elements.taskForm.reset();
  elements.taskForm.elements.title.value = task?.title ?? '';
  elements.taskForm.elements.description.value = task?.description ?? '';
  elements.taskForm.elements.priority.value = task?.priority ?? 'medium';
  elements.taskForm.dataset.column = task?.column ?? columnId;
  elements.taskDialogTitle.textContent = task ? 'Editar atividade' : 'Nova atividade';
  elements.taskDialog.querySelector('[type="submit"]').textContent = task ? 'Salvar alterações' : 'Salvar atividade';
  elements.taskDialog.showModal();
  elements.taskForm.elements.title.focus();
}

function abrirFormularioDeQuadro(rename = false) {
  boardBeingEdited = rename;
  elements.boardForm.reset();
  elements.boardForm.elements.name.value = rename ? obterQuadroAtual().name : '';
  elements.boardDialogTitle.textContent = rename ? 'Renomear quadro' : 'Novo quadro';
  elements.boardDialog.querySelector('[type="submit"]').textContent = rename ? 'Salvar alterações' : 'Criar quadro';
  elements.boardDialog.showModal();
  elements.boardForm.elements.name.focus();
}

function abrirConfirmacao({ title, message, action, id }) {
  pendingDelete = { action, id };
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmDialog.showModal();
}

function moverAtividade(taskId, columnId) {
  const task = obterQuadroAtual().tasks.find((item) => item.id === taskId);
  if (!task || !COLUMNS.some((column) => column.id === columnId)) return;
  task.column = columnId;
  salvarEstado();
  renderizar();
}

function mostrarAviso(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 3500);
}

elements.board.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add-to]');
  if (addButton) {
    abrirFormularioDeAtividade(addButton.dataset.addTo);
    return;
  }

  const actionButton = event.target.closest('[data-action]');
  if (!actionButton || actionButton.disabled) return;
  const card = actionButton.closest('[data-task-id]');
  const task = obterQuadroAtual().tasks.find((item) => item.id === card.dataset.taskId);
  if (!task) return;

  const columnIndex = COLUMNS.findIndex((column) => column.id === task.column);
  if (actionButton.dataset.action === 'previous') moverAtividade(task.id, COLUMNS[columnIndex - 1].id);
  if (actionButton.dataset.action === 'next') moverAtividade(task.id, COLUMNS[columnIndex + 1].id);
  if (actionButton.dataset.action === 'edit') abrirFormularioDeAtividade(task.column, task);
  if (actionButton.dataset.action === 'delete') {
    abrirConfirmacao({ title: 'Excluir atividade?', message: `A atividade “${task.title}” será removida permanentemente.`, action: 'task', id: task.id });
  }
});

elements.board.addEventListener('dragstart', (event) => {
  const card = event.target.closest('[data-task-id]');
  if (!card) return;
  draggedTaskId = card.dataset.taskId;
  card.classList.add('is-dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', draggedTaskId);
});

elements.board.addEventListener('dragend', (event) => {
  event.target.closest('[data-task-id]')?.classList.remove('is-dragging');
  elements.board.querySelectorAll('.is-over').forEach((column) => column.classList.remove('is-over'));
  draggedTaskId = null;
});

elements.board.addEventListener('dragover', (event) => {
  const list = event.target.closest('[data-drop-column]');
  if (!list) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  list.closest('.kanban-column').classList.add('is-over');
});

elements.board.addEventListener('dragleave', (event) => {
  const column = event.target.closest('.kanban-column');
  if (column && !column.contains(event.relatedTarget)) column.classList.remove('is-over');
});

elements.board.addEventListener('drop', (event) => {
  const list = event.target.closest('[data-drop-column]');
  if (!list) return;
  event.preventDefault();
  list.closest('.kanban-column').classList.remove('is-over');
  const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
  if (taskId) moverAtividade(taskId, list.dataset.dropColumn);
});

elements.taskForm.addEventListener('submit', (event) => {
  // Valida e normaliza os campos antes de atualizar o quadro ativo.
  event.preventDefault();
  const formData = new FormData(elements.taskForm);
  const title = String(formData.get('title')).trim();
  if (!title) return;

  const board = obterQuadroAtual();
  const taskData = {
    title,
    description: String(formData.get('description')).trim(),
    priority: Object.hasOwn(PRIORITIES, formData.get('priority')) ? formData.get('priority') : 'medium',
    column: elements.taskForm.dataset.column,
  };
  const existingTask = board.tasks.find((task) => task.id === taskBeingEdited);
  if (existingTask) Object.assign(existingTask, taskData);
  else board.tasks.push({ id: criarId(), ...taskData });

  elements.taskDialog.close();
  salvarEstado();
  renderizar();
});

elements.boardForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = String(new FormData(elements.boardForm).get('name')).trim();
  if (!name) return;

  if (boardBeingEdited) obterQuadroAtual().name = name;
  else {
    const board = criarQuadro(name);
    state.boards.push(board);
    state.activeBoardId = board.id;
  }
  elements.boardDialog.close();
  salvarEstado();
  renderizar();
});

elements.confirmForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!pendingDelete) return;
  if (pendingDelete.action === 'task') {
    const board = obterQuadroAtual();
    board.tasks = board.tasks.filter((task) => task.id !== pendingDelete.id);
  }
  if (pendingDelete.action === 'board' && state.boards.length > 1) {
    state.boards = state.boards.filter((board) => board.id !== pendingDelete.id);
    state.activeBoardId = state.boards[0].id;
  }
  pendingDelete = null;
  elements.confirmDialog.close();
  salvarEstado();
  renderizar();
});

elements.boardSelect.addEventListener('change', () => {
  state.activeBoardId = elements.boardSelect.value;
  salvarEstado();
  renderizar();
});

document.querySelector('#add-board').addEventListener('click', () => abrirFormularioDeQuadro());
document.querySelector('#rename-board').addEventListener('click', () => abrirFormularioDeQuadro(true));
document.querySelector('#delete-board').addEventListener('click', () => {
  if (state.boards.length < 2) {
    mostrarAviso('O último quadro não pode ser excluído.');
    return;
  }
  abrirConfirmacao({ title: 'Excluir quadro?', message: `O quadro “${obterQuadroAtual().name}” e todas as suas atividades serão removidos.`, action: 'board', id: state.activeBoardId });
});

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

renderizar();