'use strict';

const { randomUUID } = require('node:crypto');

const DEFAULT_COLUMNS = [
  { id: 'todo', name: 'A fazer', limit: 0 },
  { id: 'progress', name: 'Em andamento', limit: 0 },
  { id: 'done', name: 'Concluído', limit: 0 },
];
const PRIORITIES = new Set(['low', 'medium', 'high']);

function getColumns(board) {
  const columns = Array.isArray(board?.columns)
    ? board.columns.filter((column) => typeof column?.id === 'string' && column.id)
    : [];
  return columns.length ? columns : DEFAULT_COLUMNS;
}

function parseGeneratedCards(responseText, board, idFactory = randomUUID) {
  const jsonText = String(responseText)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  let response;
  try {
    response = JSON.parse(jsonText);
  } catch (error) {
    const invalidResponse = new Error('A IA retornou JSON inválido.');
    invalidResponse.code = 'invalid-ai-output';
    throw invalidResponse;
  }

  if (!Array.isArray(response?.cards) || response.cards.length !== 5) {
    const invalidCount = new Error('A IA não retornou exatamente cinco cards.');
    invalidCount.code = 'invalid-ai-output';
    throw invalidCount;
  }

  const columns = getColumns(board);
  const initialColumn = columns[0].id;
  const sprintId = typeof board.activeSprintId === 'string' ? board.activeSprintId : '';
  return response.cards.map((card) => {
    const title = typeof card?.title === 'string' ? card.title.trim().slice(0, 100) : '';
    const description = typeof card?.description === 'string' ? card.description.trim().slice(0, 500) : '';
    if (!title || !description) {
      const missingFields = new Error('A IA retornou um card sem título ou descrição.');
      missingFields.code = 'invalid-ai-output';
      throw missingFields;
    }

    const labels = Array.isArray(card.labels)
      ? card.labels
        .filter((label) => typeof label === 'string')
        .map((label) => label.trim().slice(0, 32))
        .filter(Boolean)
        .slice(0, 5)
      : [];
    return {
      id: idFactory(),
      title,
      description,
      priority: PRIORITIES.has(card.priority) ? card.priority : 'medium',
      column: initialColumn,
      deadline: '',
      assigneeId: '',
      assigneeEmail: '',
      labels,
      storyPoints: 0,
      sprintId,
      acceptanceCriteria: '',
      definitionOfDone: '',
      checklist: [],
    };
  });
}

function placeBatchTasks(cards, board) {
  const columns = getColumns(board);
  const column = columns[0];
  const sprintId = typeof board.activeSprintId === 'string' ? board.activeSprintId : '';
  const limit = Number(column.limit) || 0;
  if (limit > 0) {
    const existingCount = (Array.isArray(board.tasks) ? board.tasks : []).filter((task) => (
      task.column === column.id && (task.sprintId || '') === sprintId
    )).length;
    if (existingCount + cards.length > limit) {
      const error = new Error('Não há espaço para cinco cards na primeira coluna por causa do limite WIP.');
      error.code = 'wip-limit';
      throw error;
    }
  }
  return cards.map((card) => ({ ...card, column: column.id, sprintId }));
}

function buildBoardContext(board) {
  const tasks = Array.isArray(board.tasks) ? board.tasks : [];
  return {
    boardName: String(board.name || 'Projeto'),
    totalCards: tasks.length,
    truncated: tasks.length > 100,
    cards: tasks.slice(0, 100).map((task) => {
      const card = task && typeof task === 'object' ? task : {};
      return {
        title: String(card.title || '').slice(0, 100),
        description: String(card.description || '').slice(0, 500),
        column: String(card.column || ''),
        priority: String(card.priority || 'medium'),
        labels: Array.isArray(card.labels)
          ? card.labels.filter((label) => typeof label === 'string').slice(0, 10)
          : [],
        assignee: String(card.assigneeEmail || ''),
        deadline: String(card.deadline || ''),
        checklist: Array.isArray(card.checklist)
          ? {
            completed: card.checklist.filter((item) => item?.done === true).length,
            total: card.checklist.length,
            items: card.checklist.slice(0, 10).map((item) => String(item?.text || '').slice(0, 160)),
          }
          : { completed: 0, total: 0, items: [] },
      };
    }),
  };
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const messages = [];
  history.slice(-8).forEach((message) => {
    const role = message?.role;
    const text = typeof message?.text === 'string' ? message.text.trim().slice(0, 1000) : '';
    if (!['user', 'model'].includes(role) || !text || messages.at(-1)?.role === role) return;
    messages.push({ role, parts: [{ text }] });
  });
  if (messages[0]?.role === 'model') messages.shift();
  return messages;
}

module.exports = {
  buildBoardContext,
  normalizeHistory,
  parseGeneratedCards,
  placeBatchTasks,
};
