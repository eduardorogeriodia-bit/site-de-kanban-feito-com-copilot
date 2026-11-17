'use strict';

const admin = require('firebase-admin');
const { defineSecret } = require('firebase-functions/params');
const { onRequest } = require('firebase-functions/v2/https');
const {
  buildBoardContext,
  normalizeHistory,
  parseGeneratedCards,
  placeBatchTasks,
} = require('./ai-helpers');

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const BOARD_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const CHAT_SYSTEM_INSTRUCTION = [
  'Você é o assistente de um projeto Kanban.',
  'Responda em português, de forma prática e concisa.',
  'Use exclusivamente os dados reais dos cards fornecidos no pedido.',
  'Não invente cards, responsáveis, datas, bloqueios ou progresso.',
  'Se os dados não responderem à pergunta, diga claramente que o quadro não informa isso.',
  'Diferencie fatos dos cards de qualquer inferência; não trate uma tarefa em andamento como bloqueada sem evidência.',
].join(' ');

class ApiError extends Error {
  constructor(status, message, code = '') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function requireString(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new ApiError(400, `Informe ${field} com até ${maxLength} caracteres.`);
  }
  return value.trim();
}

function requireBoardId(value) {
  if (typeof value !== 'string' || !BOARD_ID_PATTERN.test(value)) {
    throw new ApiError(400, 'Identificador de quadro inválido.');
  }
  return value;
}

async function authenticate(request) {
  const authorization = request.get('authorization') || '';
  const tokenMatch = authorization.match(/^Bearer (.+)$/i);
  if (!tokenMatch) throw new ApiError(401, 'Entre na sua conta para usar o assistente.');
  try {
    const decoded = await admin.auth().verifyIdToken(tokenMatch[1]);
    return decoded.uid;
  } catch (error) {
    throw new ApiError(401, 'Sua sessão expirou. Entre novamente para continuar.');
  }
}

async function findAccessibleBoard(uid, boardId) {
  const boardRef = db.collection('kanbans').doc(boardId);
  const boardSnapshot = await boardRef.get();
  if (boardSnapshot.exists) {
    const board = { ...boardSnapshot.data(), id: boardSnapshot.id };
    if (board.ownerId === uid) return { board, role: 'owner', shared: true };
    const memberSnapshot = await boardRef.collection('members').doc(uid).get();
    const role = memberSnapshot.data()?.role;
    if (memberSnapshot.exists && ['editor', 'viewer'].includes(role)) {
      return { board, role, shared: true };
    }
    throw new ApiError(403, 'Você não tem acesso a este quadro.');
  }

  const stateRef = db.collection('users').doc(uid).collection('kanban').doc('state');
  const stateSnapshot = await stateRef.get();
  const state = stateSnapshot.exists ? stateSnapshot.data() : {};
  const board = (Array.isArray(state.boards) ? state.boards : []).find((item) => (
    item.id === boardId && (!item.ownerId || item.ownerId === uid) && item.isShared !== true
  ));
  if (!board) throw new ApiError(404, 'Quadro não encontrado ou sem acesso.');
  return { board, role: 'owner', shared: false };
}

function getApiKey() {
  const value = geminiApiKey.value();
  if (!value) {
    throw new ApiError(503, 'A IA ainda não foi configurada no servidor. Peça ao administrador para configurar a chave Gemini.');
  }
  return value;
}

async function requestGemini({ systemInstruction, contents, jsonResponse = false }) {
  const apiKey = getApiKey();
  const generationConfig = { temperature: 0.2, maxOutputTokens: jsonResponse ? 1800 : 800 };
  if (jsonResponse) generationConfig.responseMimeType = 'application/json';

  let response;
  try {
    response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig,
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    console.error('Falha de rede ao consultar o Gemini:', error.name);
    throw new ApiError(503, 'O serviço de IA está indisponível. Tente novamente em instantes.');
  }

  if (!response.ok) {
    console.error('Gemini respondeu com status HTTP:', response.status);
    throw new ApiError(response.status === 429 ? 503 : 502, 'Não foi possível gerar uma resposta com IA. Tente novamente.');
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();
  if (!text) throw new ApiError(502, 'A IA não retornou conteúdo. Tente novamente.');
  return text;
}

async function persistBatch(uid, boardId, generatedCards) {
  const boardRef = db.collection('kanbans').doc(boardId);
  const memberRef = boardRef.collection('members').doc(uid);
  const stateRef = db.collection('users').doc(uid).collection('kanban').doc('state');

  return db.runTransaction(async (transaction) => {
    const boardSnapshot = await transaction.get(boardRef);
    if (boardSnapshot.exists) {
      const memberSnapshot = await transaction.get(memberRef);
      const board = boardSnapshot.data();
      const role = board.ownerId === uid ? 'owner' : memberSnapshot.data()?.role;
      if (!['owner', 'editor'].includes(role)) {
        throw new ApiError(403, 'Somente o dono ou um editor pode criar cards neste quadro.');
      }
      const cards = placeBatchTasks(generatedCards, board);
      transaction.set(boardRef, {
        tasks: [...(Array.isArray(board.tasks) ? board.tasks : []), ...cards],
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return cards;
    }

    const stateSnapshot = await transaction.get(stateRef);
    const state = stateSnapshot.exists ? stateSnapshot.data() : {};
    const boards = Array.isArray(state.boards) ? state.boards : [];
    const boardIndex = boards.findIndex((board) => (
      board.id === boardId && (!board.ownerId || board.ownerId === uid) && board.isShared !== true
    ));
    if (boardIndex < 0) throw new ApiError(404, 'Quadro não encontrado ou sem acesso.');

    const board = boards[boardIndex];
    const cards = placeBatchTasks(generatedCards, board);
    const updatedBoards = [...boards];
    updatedBoards[boardIndex] = {
      ...board,
      tasks: [...(Array.isArray(board.tasks) ? board.tasks : []), ...cards],
    };
    transaction.set(stateRef, { ...state, boards: updatedBoards });
    return cards;
  });
}

async function handleRequest(request, response) {
  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  const route = new URL(request.originalUrl, 'https://localhost').pathname.replace(/\/+$/, '');
  if (!['/api/ai/chat', '/api/ai/generate-batch'].includes(route)) {
    return response.status(404).json({ error: 'Endpoint de IA não encontrado.' });
  }

  try {
    const uid = await authenticate(request);
    const body = request.body && typeof request.body === 'object' ? request.body : {};
    const boardId = requireBoardId(body.boardId);
    const access = await findAccessibleBoard(uid, boardId);

    if (route === '/api/ai/chat') {
      const question = requireString(body.question, 'uma pergunta', 1000);
      const context = buildBoardContext(access.board);
      const history = normalizeHistory(body.history);
      const contents = [
        ...history,
        {
          role: 'user',
          parts: [{
            text: [
              'Dados reais do quadro:',
              JSON.stringify(context),
              context.truncated ? 'A lista inclui apenas os primeiros 100 cards.' : '',
              `Pergunta atual: ${question}`,
            ].filter(Boolean).join('\n'),
          }],
        },
      ];
      const answer = await requestGemini({
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        contents,
      });
      return response.status(200).json({ answer });
    }

    if (!['owner', 'editor'].includes(access.role)) {
      throw new ApiError(403, 'Somente o dono ou um editor pode gerar cards neste quadro.');
    }
    const description = requireString(body.description, 'a descrição do projeto', 1500);
    const context = buildBoardContext(access.board);
    const content = [
      `Projeto: ${context.boardName}`,
      `Descrição fornecida: ${description}`,
      `Cards já existentes: ${JSON.stringify(context.cards)}`,
      'Crie exatamente cinco atividades novas, distintas e úteis para este projeto, em português.',
      'Considere o contexto e os cards existentes para não repetir trabalho.',
      'Retorne exclusivamente JSON no formato {"cards":[{"title":"...","description":"...","priority":"low|medium|high","labels":["..."]}]} .',
    ].join('\n');
    const generatedText = await requestGemini({
      systemInstruction: 'Você é um planejador de projetos. Gere somente dados de cards, sem inventar progresso, responsáveis ou prazos. As descrições devem ser acionáveis e específicas ao projeto. Cada título deve ser curto e cada descrição objetiva.',
      contents: [{ role: 'user', parts: [{ text: content }] }],
      jsonResponse: true,
    });

    let generatedCards;
    try {
      generatedCards = parseGeneratedCards(generatedText, access.board);
    } catch (error) {
      if (error.code === 'invalid-ai-output') {
        throw new ApiError(502, 'A IA não retornou cinco cards válidos. Tente ajustar a descrição do projeto.');
      }
      throw error;
    }
    const cards = await persistBatch(uid, boardId, generatedCards);
    return response.status(200).json({ cards });
  } catch (error) {
    const status = Number.isInteger(error.status)
      ? error.status
      : error.code === 'wip-limit' ? 409 : 500;
    if (status >= 500) {
      console.error('Falha no endpoint de IA:', error.code || error.name || 'unknown');
    }
    return response.status(status).json({
      error: status === 500
        ? 'Não foi possível processar a solicitação. Tente novamente.'
        : error.message,
    });
  }
}

exports.aiApi = onRequest({
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 120,
  maxInstances: 10,
  secrets: [geminiApiKey],
}, handleRequest);
