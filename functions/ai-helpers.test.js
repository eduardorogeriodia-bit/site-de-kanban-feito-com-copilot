'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  buildBoardContext,
  normalizeHistory,
  parseGeneratedCards,
  placeBatchTasks,
} = require('./ai-helpers');

function makeResponse(count = 5) {
  return JSON.stringify({
    cards: Array.from({ length: count }, (_, index) => ({
      title: `Atividade ${index + 1}`,
      description: `Descrição ${index + 1}`,
      priority: index === 0 ? 'high' : 'medium',
      labels: ['projeto'],
    })),
  });
}

test('creates five valid task records for a custom board column', () => {
  let id = 0;
  const board = {
    columns: [{ id: 'backlog', name: 'A fazer', limit: 0 }],
    activeSprintId: 'sprint-1',
  };
  const cards = parseGeneratedCards(makeResponse(), board, () => `generated-${++id}`);

  assert.equal(cards.length, 5);
  assert.equal(cards[0].column, 'backlog');
  assert.equal(cards[0].sprintId, 'sprint-1');
  assert.equal(cards[0].priority, 'high');
  assert.equal(cards[0].id, 'generated-1');
  assert.deepEqual(cards[0].checklist, []);
});

test('rejects a batch that does not contain exactly five cards', () => {
  assert.throws(
    () => parseGeneratedCards(makeResponse(4), { columns: [{ id: 'todo', limit: 0 }] }),
    { code: 'invalid-ai-output' },
  );
});

test('does not exceed the first column WIP limit when saving a batch', () => {
  const board = {
    columns: [{ id: 'todo', limit: 6 }],
    activeSprintId: '',
    tasks: [{ id: 'existing', column: 'todo', sprintId: '' }, { id: 'existing-2', column: 'todo' }],
  };
  assert.throws(
    () => placeBatchTasks(Array.from({ length: 5 }, () => ({})), board),
    { code: 'wip-limit' },
  );
});

test('limits board context to real, bounded card data', () => {
  const tasks = Array.from({ length: 101 }, (_, index) => ({
    title: `Card ${index}`,
    description: 'descrição',
    checklist: [{ text: 'Item', done: true }, { text: 'Outro item', done: false }],
  }));
  const context = buildBoardContext({ name: 'Projeto', tasks });

  assert.equal(context.totalCards, 101);
  assert.equal(context.cards.length, 100);
  assert.equal(context.truncated, true);
  assert.deepEqual(context.cards[0].checklist, {
    completed: 1,
    total: 2,
    items: ['Item', 'Outro item'],
  });
});

test('normalizes chat history and removes a leading model reply', () => {
  const history = normalizeHistory([
    { role: 'model', text: 'Resposta anterior' },
    { role: 'user', text: 'Pergunta anterior' },
    { role: 'model', text: 'Resposta válida' },
  ]);
  assert.deepEqual(history.map((message) => message.role), ['user', 'model']);
});
