'use strict';

const STORAGE_KEY = 'fluxo-kanban-v1';
const COLUMNS = [
  { id: 'todo', name: 'A fazer', className: 'todo' },
  { id: 'progress', name: 'Em andamento', className: 'progress' },
  { id: 'done', name: 'Concluído', className: 'done' },
];
const PRIORITIES = { low: 'Baixa', medium: 'Média', high: 'Alta' };

const elements = {
  loadingView: document.querySelector('#loading-view'),
  loadingMessage: document.querySelector('#loading-message'),
  loadingActions: document.querySelector('#loading-actions'),
  retryLoadButton: document.querySelector('#retry-load'),
  useDeviceDataButton: document.querySelector('#use-device-data'),
  useCloudDataButton: document.querySelector('#use-cloud-data'),
  loadingLogoutButton: document.querySelector('#loading-logout'),
  authView: document.querySelector('#auth-view'),
  appShell: document.querySelector('#app-shell'),
  loginForm: document.querySelector('#login-form'),
  loginUser: document.querySelector('#login-user'),
  loginPassword: document.querySelector('#login-password'),
  loginError: document.querySelector('#login-error'),
  togglePassword: document.querySelector('#toggle-password'),
  loginPanel: document.querySelector('#login-panel'),
  passwordResetPanel: document.querySelector('#password-reset-panel'),
  showPasswordResetButton: document.querySelector('#show-password-reset'),
  passwordResetForm: document.querySelector('#password-reset-form'),
  resetEmail: document.querySelector('#reset-email'),
  passwordResetMessage: document.querySelector('#password-reset-message'),
  backToLoginButton: document.querySelector('#back-to-login'),
  registerPanel: document.querySelector('#register-panel'),
  showRegisterButton: document.querySelector('#show-register'),
  showLoginButton: document.querySelector('#show-login'),
  registerForm: document.querySelector('#register-form'),
  registerEmail: document.querySelector('#register-email'),
  registerPassword: document.querySelector('#register-password'),
  registerConfirmPassword: document.querySelector('#register-confirm-password'),
  registerError: document.querySelector('#register-error'),
  logoutButton: document.querySelector('#logout-button'),
  boardTools: document.querySelector('#board-tools'),
  homePage: document.querySelector('#home-page'),
  homeUserName: document.querySelector('#home-user-name'),
  homeBoardCount: document.querySelector('#home-board-count'),
  colleaguesPage: document.querySelector('#colleagues-page'),
  colleaguesError: document.querySelector('#colleagues-error'),
  incomingFriendRequests: document.querySelector('#incoming-friend-requests'),
  incomingRequestsEmpty: document.querySelector('#incoming-requests-empty'),
  friendsList: document.querySelector('#friends-list'),
  friendsEmpty: document.querySelector('#friends-empty'),
  outgoingFriendRequests: document.querySelector('#outgoing-friend-requests'),
  outgoingRequestsEmpty: document.querySelector('#outgoing-requests-empty'),
  boardsPage: document.querySelector('#boards-page'),
  boardsList: document.querySelector('#boards-list'),
  boardsEmptyState: document.querySelector('#boards-empty-state'),
  boardsAddButton: document.querySelector('#boards-add-board'),
  boardPage: document.querySelector('#board-page'),
  boardContent: document.querySelector('#board-content'),
  boardNotFound: document.querySelector('#board-not-found'),
  profilePage: document.querySelector('#profile-page'),
  profileForm: document.querySelector('#profile-form'),
  profileView: document.querySelector('#profile-view'),
  profileViewName: document.querySelector('#profile-view-name'),
  profileViewBio: document.querySelector('#profile-view-bio'),
  profileEditButton: document.querySelector('#profile-edit'),
  profileCancelButton: document.querySelector('#profile-cancel'),
  profileDisplayName: document.querySelector('#profile-display-name'),
  profileBio: document.querySelector('#profile-bio'),
  profileError: document.querySelector('#profile-error'),
  profilePublicUrl: document.querySelector('#profile-public-url'),
  copyProfileLinkButton: document.querySelector('#copy-profile-link'),
  publicProfilePage: document.querySelector('#public-profile-page'),
  publicProfileCard: document.querySelector('#public-profile-card'),
  publicProfileName: document.querySelector('#public-profile-name'),
  publicProfileBio: document.querySelector('#public-profile-bio'),
  publicProfileActions: document.querySelector('#public-profile-actions'),
  publicProfileMessage: document.querySelector('#public-profile-message'),
  profileInviteDialog: document.querySelector('#profile-invite-dialog'),
  profileInviteForm: document.querySelector('#profile-invite-form'),
  profileInviteBoardName: document.querySelector('#profile-invite-board-name'),
  profileInviteRole: document.querySelector('#profile-invite-role'),
  profileInviteError: document.querySelector('#profile-invite-error'),
  taskPageBack: document.querySelector('#task-page-back'),
  boardSelect: document.querySelector('#board-select'),
  shareButton: document.querySelector('#share-board'),
  invitationsPanel: document.querySelector('#invitations-panel'),
  invitationsList: document.querySelector('#invitations-list'),
  shareDialog: document.querySelector('#share-dialog'),
  shareForm: document.querySelector('#share-form'),
  shareEmail: document.querySelector('#share-email'),
  shareRole: document.querySelector('#share-role'),
  shareError: document.querySelector('#share-error'),
  boardMembers: document.querySelector('#board-members'),
  sprintFilter: document.querySelector('#sprint-filter'),
  backlogSummary: document.querySelector('#backlog-summary'),
  createSprintButton: document.querySelector('#create-sprint'),
  sprintDialog: document.querySelector('#sprint-dialog'),
  sprintForm: document.querySelector('#sprint-form'),
  boardHistoryList: document.querySelector('#board-history-list'),
  manageColumnsButton: document.querySelector('#manage-columns'),
  columnsDialog: document.querySelector('#columns-dialog'),
  columnsForm: document.querySelector('#columns-form'),
  columnSettingsList: document.querySelector('#column-settings-list'),
  newColumnName: document.querySelector('#new-column-name'),
  newColumnLimit: document.querySelector('#new-column-limit'),
  addColumnButton: document.querySelector('#add-column'),
  taskPage: document.querySelector('#task-page'),
  taskPageTitle: document.querySelector('#task-page-title'),
  taskPageDescription: document.querySelector('#task-page-description'),
  taskPageMeta: document.querySelector('#task-page-meta'),
  taskPageChecklist: document.querySelector('#task-page-checklist'),
  taskPageEdit: document.querySelector('#task-page-edit'),
  taskComments: document.querySelector('#task-comments'),
  commentForm: document.querySelector('#comment-form'),
  commentText: document.querySelector('#comment-text'),
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

let state = null;
let taskBeingEdited = null;
let boardBeingEdited = false;
let pendingDelete = null;
let draggedTaskId = null;
let toastTimer;
let authenticatedUser = null;
let currentProfile = null;
let profileBeingInvited = null;
let authGeneration = 0;
let saveQueue = Promise.resolve();
const saveVersions = new Map();
let pendingLocalState = null;
let pendingInvitations = [];
let boardMembers = [];
let boardInvitations = [];
let boardSubscription = null;
let subscribedBoardId = null;
let commentsSubscription = null;
let activeTaskId = null;
let activeTaskBoardId = null;
let editingColumns = [];
let historySubscription = null;
let subscribedHistoryKey = null;

function criarId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function criarQuadro(name) {
  return {
    id: criarId(),
    name,
    columns: COLUMNS.map((column) => ({ ...column, limit: 0 })),
    sprints: [],
    tasks: [],
  };
}

function exibirMensagemErro(message) {
  elements.loginError.textContent = message;
}

function limparMensagemErro() {
  elements.loginError.textContent = '';
}

function mostrarFormularioDeCadastro() {
  elements.registerEmail.value = elements.loginUser.value.trim();
  elements.loginError.textContent = '';
  elements.registerError.textContent = '';
  elements.loginPanel.classList.add('hidden');
  elements.passwordResetPanel.classList.add('hidden');
  elements.registerPanel.classList.remove('hidden');
  elements.registerEmail.focus();
}

function mostrarFormularioDeLogin() {
  elements.loginError.textContent = '';
  elements.registerError.textContent = '';
  elements.passwordResetMessage.textContent = '';
  elements.registerPanel.classList.add('hidden');
  elements.passwordResetPanel.classList.add('hidden');
  elements.loginPanel.classList.remove('hidden');
  elements.loginUser.focus();
}

function mostrarFormularioDeRedefinicao() {
  elements.resetEmail.value = elements.loginUser.value.trim();
  elements.loginError.textContent = '';
  elements.passwordResetMessage.textContent = '';
  elements.loginPanel.classList.add('hidden');
  elements.registerPanel.classList.add('hidden');
  elements.passwordResetPanel.classList.remove('hidden');
  elements.resetEmail.focus();
}

function alternarVisibilidadeSenha() {
  const isPassword = elements.loginPassword.type === 'password';
  elements.loginPassword.type = isPassword ? 'text' : 'password';
  elements.togglePassword.textContent = isPassword ? 'Ocultar' : 'Mostrar';
  elements.togglePassword.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
}

function exibirPainelAutenticado() {
  elements.loadingView.classList.add('hidden');
  elements.authView.classList.add('hidden');
  elements.appShell.classList.remove('hidden');
  elements.taskPage.classList.add('hidden');
}

function exibirPainelLogin() {
  elements.loadingView.classList.add('hidden');
  elements.authView.classList.remove('hidden');
  elements.appShell.classList.add('hidden');
  elements.taskPage.classList.add('hidden');
}

function exibirCarregamento(message, failed = false, conflict = false) {
  elements.loadingView.classList.remove('hidden');
  elements.loadingMessage.textContent = message;
  elements.loadingActions.classList.toggle('hidden', !failed);
  elements.retryLoadButton.classList.toggle('hidden', !failed || conflict);
  elements.useDeviceDataButton.classList.toggle('hidden', !conflict);
  elements.useCloudDataButton.classList.toggle('hidden', !conflict);
  elements.loadingLogoutButton.classList.toggle('hidden', !failed);
  elements.authView.classList.add('hidden');
  elements.appShell.classList.add('hidden');
}

function papelDoQuadro(board) {
  return board.role ?? (board.ownerId === authenticatedUser?.uid ? 'owner' : 'viewer');
}

function podeEditarQuadro(board = obterQuadroAtual()) {
  return Boolean(board && ['owner', 'editor'].includes(papelDoQuadro(board)));
}

function obterReferenciaDoQuadro(boardId) {
  return obterDb().collection('kanbans').doc(boardId);
}

function atualizarPainelDeConvites() {
  elements.invitationsList.replaceChildren();
  elements.invitationsPanel.classList.toggle('hidden', pendingInvitations.length === 0);
  pendingInvitations.forEach((invite) => {
    const row = criarElemento('div', 'invitation-row');
    const description = criarElemento(
      'span',
      'invitation-description',
      `${invite.boardName || 'Quadro'} — acesso de ${invite.role === 'editor' ? 'editor' : 'leitor'}`,
    );
    const accept = criarElemento('button', 'button button-primary', 'Aceitar');
    accept.type = 'button';
    accept.addEventListener('click', () => void aceitarConvite(invite));
    row.append(description, accept);
    elements.invitationsList.append(row);
  });
}

async function carregarQuadrosEConvitesCompartilhados(user) {
  const db = obterDb();
  const [memberships, ownedSharedBoards, emailInvitations, userInvitations] = await Promise.all([
    db.collectionGroup('members').where('uid', '==', user.uid).get(),
    db.collection('kanbans').where('ownerId', '==', user.uid).get(),
    user.email
      ? db.collectionGroup('invites').where('invitedEmail', '==', user.email.trim().toLowerCase()).get()
      : Promise.resolve({ docs: [] }),
    db.collectionGroup('invites').where('invitedUid', '==', user.uid).get(),
  ]);
  const sharedById = new Map();
  const memberBoards = await Promise.all(memberships.docs.map(async (membership) => {
    const boardId = membership.ref.parent.parent.id;
    const boardSnapshot = await obterReferenciaDoQuadro(boardId).get();
    if (!boardSnapshot.exists) return null;
    return {
      ...boardSnapshot.data(),
      id: boardId,
      role: membership.data().role,
      isShared: true,
    };
  }));
  memberBoards.forEach((board) => {
    if (board) sharedById.set(board.id, board);
  });
  ownedSharedBoards.docs.forEach((snapshot) => {
    const data = snapshot.data();
    sharedById.set(snapshot.id, { ...data, id: snapshot.id, role: 'owner', isShared: true });
  });
  const invitationSnapshots = new Map(
    [...emailInvitations.docs, ...userInvitations.docs].map((snapshot) => [snapshot.ref.path, snapshot]),
  );
  pendingInvitations = [...invitationSnapshots.values()].map((snapshot) => ({
    ...snapshot.data(),
    id: snapshot.id,
    boardId: snapshot.ref.parent.parent.id,
  }));
  atualizarPainelDeConvites();
  return [...sharedById.values()];
}

async function aceitarConvite(invite) {
  const user = authenticatedUser;
  if (!user?.email || !invite?.boardId || !invite?.id) return;
  try {
    const db = obterDb();
    const inviteRef = obterReferenciaDoQuadro(invite.boardId).collection('invites').doc(invite.id);
    await obterReferenciaDoQuadro(invite.boardId).collection('members').doc(user.uid).set({
      uid: user.uid,
      email: user.email.trim().toLowerCase(),
      role: invite.role,
      inviteId: invite.id,
    });
    await inviteRef.delete();
    await sincronizarSessao(user);
    mostrarAviso(`Você agora tem acesso ao quadro “${invite.boardName || 'compartilhado'}”.`);
  } catch (error) {
    console.error('Não foi possível aceitar o convite:', error);
    mostrarAviso(error?.code === 'permission-denied'
      ? 'O convite não corresponde à conta conectada ou já expirou.'
      : 'Não foi possível aceitar o convite. Tente novamente.');
  }
}

function obterAuth() {
  return window.firebaseAuth ?? null;
}

function obterDb() {
  return window.firebaseDb ?? null;
}

function obterChaveDeCache(uid) {
  return `${STORAGE_KEY}:${uid}`;
}

async function autenticarUsuario(username, password, criarConta = false) {
  const email = String(username).trim();
  const auth = obterAuth();
  if (!auth) {
    throw new Error('Firebase ainda não foi configurado. Edite o arquivo firebase-config.js com os dados do seu projeto.');
  }

  return criarConta
    ? auth.createUserWithEmailAndPassword(email, password)
    : auth.signInWithEmailAndPassword(email, password);
}

function inicializarAutenticacao() {
  const auth = obterAuth();
  if (!auth || !auth.onAuthStateChanged) {
    exibirPainelLogin();
    exibirMensagemErro('Não foi possível iniciar o Firebase. Verifique a configuração e recarregue a página.');
    return;
  }

  auth.onAuthStateChanged((user) => {
    void sincronizarSessao(user);
  }, (error) => {
    console.error('Não foi possível verificar a sessão do Firebase:', error);
    authGeneration += 1;
    authenticatedUser = null;
    state = null;
    exibirPainelLogin();
    exibirMensagemErro('Não foi possível verificar sua sessão. Recarregue a página e tente novamente.');
  });
}

async function sincronizarSessao(user) {
  const generation = ++authGeneration;
  authenticatedUser = user;
  currentProfile = null;
  state = null;
  pendingLocalState = null;

  if (!user) {
    pendingLocalState = null;
    elements.loginForm.reset();
    elements.registerForm.reset();
    elements.passwordResetForm.reset();
    elements.registerError.textContent = '';
    elements.passwordResetMessage.textContent = '';
    elements.registerPanel.classList.add('hidden');
    elements.passwordResetPanel.classList.add('hidden');
    elements.loginPanel.classList.remove('hidden');
    elements.loginPassword.type = 'password';
    elements.togglePassword.textContent = 'Mostrar';
    elements.togglePassword.setAttribute('aria-label', 'Mostrar senha');
    limparMensagemErro();
    exibirPainelLogin();
    return;
  }

  exibirCarregamento('Carregando seu quadro...');
  try {
    const loaded = await carregarEstadoDoFirestore(user, generation);
    if (generation !== authGeneration) return;
    if (!loaded) return;
    renderizar();
    exibirPainelAutenticado();
    await abrirRotaAutenticada();
  } catch (error) {
    if (generation !== authGeneration) return;
    console.error('Não foi possível carregar os dados do usuário:', error);
    const dataError = error?.message?.startsWith('O cache local') || error?.message?.startsWith('O documento do quadro');
    const message = dataError
      ? error.message
      : error?.code === 'permission-denied'
        ? 'Sem permissão para acessar seu quadro. Verifique as regras do Firestore.'
        : 'Não foi possível carregar seu quadro. Verifique sua conexão e as regras do Firestore.';
    exibirCarregamento(message, true);
  }
}

function validarEstadoDoQuadro(data) {
  if (!data || !Array.isArray(data.boards)) return false;
  return data.boards.every((board) => (
    board
    && typeof board.id === 'string'
    && typeof board.name === 'string'
    && Array.isArray(board.tasks)
    && board.tasks.every((task) => (
      task
      && typeof task.id === 'string'
      && typeof task.title === 'string'
      && typeof task.description === 'string'
      && (board.columns ?? COLUMNS).some((column) => column.id === task.column)
    ))
  ));
}

function carregarCacheDoUsuario(uid) {
  const saved = localStorage.getItem(obterChaveDeCache(uid));
  if (!saved) return null;

  let parsed;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    console.error('Não foi possível carregar o cache local do usuário:', error);
    throw new Error('O cache local desta conta está corrompido. Os dados remotos foram preservados.');
  }
  const cachedState = parsed?.data ?? parsed;
  if (!validarEstadoDoQuadro(cachedState)) {
    throw new Error('O cache local desta conta possui um formato inválido. Os dados remotos foram preservados.');
  }
  return {
    state: {
      boards: cachedState.boards,
      activeBoardId: cachedState.boards.some((board) => board.id === cachedState.activeBoardId)
        ? cachedState.activeBoardId
        : cachedState.boards[0]?.id,
    },
    pending: parsed?.version === 1 && parsed.pending === true,
  };
}

function atualizarCacheDoUsuario(uid, data, pending = false) {
  localStorage.setItem(obterChaveDeCache(uid), JSON.stringify({ version: 1, data, pending }));
}

function estadosEquivalentes(first, second) {
  return JSON.stringify(first) === JSON.stringify(second);
}

async function carregarEstadoDoFirestore(user, generation) {
  const db = obterDb();
  if (!db) throw new Error('Firestore não foi inicializado.');

  const documentRef = db.collection('users').doc(user.uid).collection('kanban').doc('state');
  const snapshot = await documentRef.get();
  if (generation !== authGeneration) return;

  const cache = carregarCacheDoUsuario(user.uid);
  if (snapshot.exists) {
    const data = snapshot.data();
    if (!validarEstadoDoQuadro(data)) {
      throw new Error('O documento do quadro não possui um formato válido. Os dados remotos foram preservados.');
    }
    const remoteState = {
      boards: data.boards,
      activeBoardId: data.boards.some((board) => board.id === data.activeBoardId) ? data.activeBoardId : data.boards[0]?.id,
    };
    state = remoteState;
  } else {
    state = cache?.state ?? (() => {
      const firstBoard = criarQuadro('Meu quadro');
      return { boards: [firstBoard], activeBoardId: firstBoard.id };
    })();
    await documentRef.set(state);
  }

  state.boards = state.boards.map((board) => ({
    ...board,
    ownerId: board.ownerId ?? user.uid,
    role: 'owner',
    isShared: board.isShared === true,
  }));
  const sharedBoards = await carregarQuadrosEConvitesCompartilhados(user);
  if (generation !== authGeneration) return false;
  const boardsById = new Map(state.boards.map((board) => [board.id, board]));
  sharedBoards.forEach((board) => boardsById.set(board.id, board));
  state.boards = [...boardsById.values()];
  if (cache?.pending && !estadosEquivalentes(cache.state, state)) {
    pendingLocalState = {
      uid: user.uid,
      localState: cache.state,
      remoteState: JSON.parse(JSON.stringify(state)),
    };
    exibirCarregamento('Há alterações não sincronizadas neste dispositivo. Escolha qual versão manter.', true, true);
    return false;
  }
  if (state.boards.length === 0) {
    const firstBoard = criarQuadro('Meu quadro');
    state.boards = [{ ...firstBoard, ownerId: user.uid, role: 'owner' }];
    state.activeBoardId = firstBoard.id;
    await documentRef.set({ boards: [firstBoard], activeBoardId: firstBoard.id });
  }
  if (!state.boards.some((board) => board.id === state.activeBoardId)) {
    state.activeBoardId = state.boards[0]?.id;
  }

  try {
    atualizarCacheDoUsuario(user.uid, state, false);
  } catch (error) {
    console.error('Não foi possível atualizar o cache local do usuário:', error);
  }
  return true;
}

function usarDadosDoFirebase() {
  if (!pendingLocalState || authenticatedUser?.uid !== pendingLocalState.uid) return;
  state = pendingLocalState.remoteState;
  pendingLocalState = null;
  try {
    atualizarCacheDoUsuario(authenticatedUser.uid, state, false);
  } catch (error) {
    console.error('Não foi possível atualizar o cache local do usuário:', error);
  }
  renderizar();
  exibirPainelAutenticado();
  elements.saveStatus.textContent = 'Dados carregados do Firebase';
  elements.saveStatus.classList.remove('has-error');
  mostrarAviso('Versão do Firebase mantida; alterações locais pendentes descartadas.');
}

async function usarDadosDoDispositivo() {
  const conflict = pendingLocalState;
  if (!conflict || authenticatedUser?.uid !== conflict.uid) return;

  state = conflict.localState;
  exibirCarregamento('Aplicando os dados deste dispositivo ao Firebase...');
  try {
    atualizarCacheDoUsuario(conflict.uid, state, true);
  } catch (error) {
    console.error('Não foi possível guardar o cache local do usuário:', error);
  }

  const db = obterDb();
  try {
    const writes = [
      db.collection('users').doc(conflict.uid).collection('kanban').doc('state').set({
        boards: state.boards.filter((board) => board.ownerId === conflict.uid && board.isShared !== true),
        activeBoardId: state.boards.some((board) => board.ownerId === conflict.uid && board.id === state.activeBoardId)
          ? state.activeBoardId
          : null,
      }),
    ];
    state.boards.filter((board) => board.isShared && podeEditarQuadro(board)).forEach((board) => {
      const { role, isShared, ...boardData } = board;
      writes.push(obterReferenciaDoQuadro(board.id).set(boardData, { merge: true }));
    });
    await Promise.all(writes);
    try {
      atualizarCacheDoUsuario(conflict.uid, state, false);
    } catch (error) {
      console.error('Não foi possível atualizar o cache local do usuário:', error);
    }
    pendingLocalState = null;
    renderizar();
    exibirPainelAutenticado();
    elements.saveStatus.textContent = 'Alterações sincronizadas';
    elements.saveStatus.classList.remove('has-error');
    mostrarAviso('A versão deste dispositivo foi aplicada ao Firebase.');
  } catch (error) {
    console.error('Não foi possível sincronizar os dados deste dispositivo:', error);
    pendingLocalState = null;
    renderizar();
    exibirPainelAutenticado();
    elements.saveStatus.textContent = 'Salvo neste dispositivo; falha na sincronização';
    elements.saveStatus.classList.add('has-error');
    mostrarAviso('Os dados do dispositivo foram mantidos. Tente sincronizar novamente quando a conexão estiver disponível.');
  }
}

async function encerrarSessao() {
  const auth = obterAuth();
  if (!auth) return;

  try {
    await auth.signOut();
  } catch (error) {
    console.error('Não foi possível encerrar a sessão:', error);
    mostrarAviso('Não foi possível sair da conta. Tente novamente.');
  }
}

function traduzirErroDeAutenticacao(error, criandoConta = false) {
  const messages = {
    'auth/invalid-email': 'Informe um endereço de e-mail válido.',
    'auth/user-disabled': 'Esta conta foi desativada. Fale com o administrador.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já possui uma conta. Tente entrar.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    'auth/network-request-failed': 'Falha de conexão. Verifique sua internet e tente novamente.',
    'auth/operation-not-allowed': criandoConta
      ? 'A criação de contas por e-mail e senha não está habilitada no Firebase. Peça ao administrador para ativar esse provedor.'
      : 'O login por e-mail e senha não está habilitado no Firebase.',
    'auth/configuration-not-found': 'O provedor de e-mail/senha não está habilitado no Firebase. Peça ao administrador para ativá-lo em Authentication > Sign-in method.',
    'auth/invalid-api-key': 'A configuração do Firebase está inválida. Peça ao administrador para verificar a chave de API.',
    'auth/app-not-authorized': 'Este domínio não está autorizado no Firebase. Peça ao administrador para adicioná-lo aos domínios autorizados.',
    'auth/unauthorized-domain': 'Este domínio não está autorizado no Firebase. Peça ao administrador para adicioná-lo aos domínios autorizados.',
    'auth/admin-restricted-operation': 'O Firebase está restringindo a criação de contas. Peça ao administrador para verificar as configurações de autenticação.',
  };
  if (!error?.code && error?.message?.startsWith('Firebase ainda não foi configurado')) {
    return 'O Firebase não está configurado. Atualize a página ou fale com o administrador.';
  }
  return messages[error?.code] || (criandoConta
    ? 'Não foi possível criar a conta. Verifique sua conexão, se E-mail/senha está habilitado e se este domínio está autorizado no Firebase.'
    : 'Não foi possível entrar. Verifique o e-mail e a senha e tente novamente.');
}

async function salvarEstado(message = 'Atualizou o quadro') {
  const user = authenticatedUser;
  if (!user || !state) {
    elements.saveStatus.textContent = 'Não foi possível salvar';
    elements.saveStatus.classList.add('has-error');
    mostrarAviso('Entre novamente antes de alterar o quadro.');
    return;
  }

  const uid = user.uid;
  const data = JSON.parse(JSON.stringify(state));
  const version = (saveVersions.get(uid) ?? 0) + 1;
  saveVersions.set(uid, version);
  let cacheError = null;
  elements.saveStatus.textContent = 'Sincronizando...';
  elements.saveStatus.classList.remove('has-error');

  try {
    atualizarCacheDoUsuario(uid, data, true);
  } catch (error) {
    cacheError = error;
    console.error('Não foi possível salvar o cache local do usuário:', error);
  }

  const db = obterDb();
  if (!db) {
    elements.saveStatus.textContent = 'Não foi possível salvar';
    elements.saveStatus.classList.add('has-error');
    mostrarAviso('O Firebase não está disponível. As alterações não foram sincronizadas.');
    return;
  }

  const ownedBoards = data.boards.filter((board) => board.ownerId === uid && board.isShared !== true);
  const activeOwnedBoard = ownedBoards.some((board) => board.id === data.activeBoardId)
    ? data.activeBoardId
    : ownedBoards[0]?.id;
  const writes = [
    () => db.collection('users').doc(uid).collection('kanban').doc('state').set({
      boards: ownedBoards,
      activeBoardId: activeOwnedBoard ?? null,
    }),
  ];
  const activeBoard = data.boards.find((board) => board.id === data.activeBoardId);
  if (activeBoard?.isShared && podeEditarQuadro(activeBoard)) {
    const { role, isShared, ...boardData } = activeBoard;
    writes.push(() => obterReferenciaDoQuadro(activeBoard.id).set({
        ...boardData,
        updatedAt: new Date().toISOString(),
      }, { merge: true }));
  }
  const nextSave = saveQueue.catch(() => {}).then(() => Promise.all(writes.map((write) => write())));
  saveQueue = nextSave;
  try {
    await nextSave;
    if (activeBoard && podeEditarQuadro(activeBoard)) {
      try {
        const activityCollection = activeBoard.isShared
          ? obterReferenciaDoQuadro(activeBoard.id).collection('activity')
          : db.collection('users').doc(uid).collection('kanban').doc(activeBoard.id).collection('activity');
        await activityCollection.add({
          actorId: uid,
          actorEmail: user.email || '',
          message,
          createdAt: Date.now(),
        });
      } catch (error) {
        console.error('Não foi possível registrar a alteração no histórico:', error);
      }
    }
    if (saveVersions.get(uid) === version) {
      try {
        atualizarCacheDoUsuario(uid, data, false);
      } catch (error) {
        console.error('Não foi possível atualizar o cache local do usuário:', error);
      }
    }
    if (authenticatedUser?.uid !== uid) return;
    elements.saveStatus.textContent = cacheError ? 'Sincronizado com o Firebase' : 'Alterações sincronizadas';
  } catch (error) {
    console.error('Não foi possível sincronizar com o Firestore:', error);
    if (authenticatedUser?.uid !== uid) return;
    elements.saveStatus.textContent = cacheError ? 'Não foi possível salvar' : 'Salvo neste dispositivo; falha na sincronização';
    elements.saveStatus.classList.add('has-error');
    mostrarAviso(cacheError
      ? 'Falha ao salvar no dispositivo e ao sincronizar com o Firebase.'
      : 'As alterações estão no cache deste usuário, mas não foram sincronizadas com o Firebase.');
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
  const board = obterQuadroAtual();
  if (!board) return;
  elements.boardTitle.textContent = board.name;
  elements.board.replaceChildren();
  atualizarSeletorDeQuadros();
  elements.shareButton.classList.toggle('hidden', papelDoQuadro(board) !== 'owner');
  elements.manageColumnsButton.classList.toggle('hidden', !podeEditarQuadro(board));
  elements.createSprintButton.disabled = !podeEditarQuadro(board);
  document.querySelector('#rename-board').disabled = papelDoQuadro(board) !== 'owner';
  document.querySelector('#delete-board').disabled = papelDoQuadro(board) !== 'owner' || state.boards.filter((item) => item.ownerId === authenticatedUser?.uid).length < 2;
  document.querySelector('#add-board').disabled = false;
  atualizarSeletorDeSprints(board);

  let total = 0;
  const activeSprintId = board.activeSprintId || '';
  const columns = Array.isArray(board.columns) && board.columns.length
    ? board.columns
    : COLUMNS;
  columns.forEach((column, columnIndex) => {
    const tasks = board.tasks.filter((task) => task.column === column.id && (task.sprintId || '') === activeSprintId);
    total += tasks.length;
    elements.board.append(criarColuna(column, columnIndex, tasks));
  });
  elements.totalCount.textContent = `${total} ${total === 1 ? 'atividade' : 'atividades'}`;
  ensureBoardSubscription(board);
  ensureHistorySubscription(board);
}

function atualizarNavegacaoAtiva(route) {
  document.querySelectorAll('[data-route-link]').forEach((link) => {
    const active = link.dataset.routeLink === route;
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function renderizarInicio() {
  const displayName = currentProfile?.displayName
    || authenticatedUser.displayName
    || 'ao Fluxo';
  elements.homeUserName.textContent = displayName;
  const ownedCount = state.boards.filter((board) => board.ownerId === authenticatedUser.uid).length;
  const sharedCount = state.boards.length - ownedCount;
  elements.homeBoardCount.textContent = `${ownedCount} ${ownedCount === 1 ? 'quadro' : 'quadros'}`
    + (sharedCount ? ` · ${sharedCount} compartilhado${sharedCount === 1 ? '' : 's'}` : '');
}

function renderizarListaDeQuadros() {
  elements.boardsList.replaceChildren();
  const groups = [
    ['Meus quadros', state.boards.filter((board) => board.ownerId === authenticatedUser.uid)],
    ['Compartilhados comigo', state.boards.filter((board) => board.ownerId !== authenticatedUser.uid)],
  ].filter(([, boards]) => boards.length);

  groups.forEach(([title, boards]) => {
    const group = criarElemento('section', 'board-list-group');
    group.append(criarElemento('h2', '', title));
    const list = criarElemento('div', 'board-list');
    boards.forEach((board) => {
      const link = criarElemento('a', 'board-list-card');
      link.href = `/quadros/${encodeURIComponent(board.id)}`;
      link.append(
        criarElemento('span', 'board-list-card-mark', '▦'),
        criarElemento('span', 'board-list-card-name', board.name),
        criarElemento(
          'span',
          'board-list-card-meta',
          `${board.tasks.length} ${board.tasks.length === 1 ? 'atividade' : 'atividades'}`
            + (board.ownerId !== authenticatedUser.uid ? ' · compartilhado' : ''),
        ),
      );
      list.append(link);
    });
    group.append(list);
    elements.boardsList.append(group);
  });

  const isEmpty = groups.length === 0;
  elements.boardsEmptyState.classList.toggle('hidden', !isEmpty);
  elements.boardsList.classList.toggle('hidden', isEmpty);
}

async function carregarMeuPerfil() {
  const snapshot = await obterDb().collection('profiles').doc(authenticatedUser.uid).get();
  currentProfile = snapshot.exists ? snapshot.data() : null;
  const defaultName = currentProfile?.displayName
    || authenticatedUser.displayName
    || '';
  elements.profileDisplayName.value = defaultName;
  elements.profileBio.value = currentProfile?.bio || '';
  elements.profilePublicUrl.value = `${window.location.origin}/perfil/${encodeURIComponent(authenticatedUser.uid)}`;
  elements.profileViewName.textContent = currentProfile?.displayName || '';
  elements.profileViewBio.textContent = currentProfile?.bio || 'Você ainda não adicionou uma biografia.';
  mostrarEditorDePerfil(!currentProfile?.displayName);
  renderizarInicio();
}

function mostrarEditorDePerfil(editing) {
  const hasProfile = Boolean(currentProfile?.displayName);
  elements.profileForm.classList.toggle('hidden', !editing);
  elements.profileView.classList.toggle('hidden', editing || !hasProfile);
  elements.profileCancelButton.classList.toggle('hidden', !editing || !hasProfile);
  if (editing) elements.profileDisplayName.focus();
}

function referenciaDeColegas(uid) {
  return obterDb().collection('users').doc(uid);
}

async function obterNomeDoPerfil(uid) {
  const snapshot = await obterDb().collection('profiles').doc(uid).get();
  return {
    uid,
    displayName: snapshot.exists ? snapshot.data().displayName : 'Perfil indisponível',
  };
}

function criarCartaoDeColega(profile, actions = []) {
  const card = criarElemento('article', 'colleague-card');
  const link = criarElemento('a', 'colleague-name', profile.displayName);
  link.href = `/perfil/${encodeURIComponent(profile.uid)}`;
  const actionList = criarElemento('div', 'colleague-actions');
  actions.forEach((action) => actionList.append(action));
  card.append(link, actionList);
  return card;
}

function criarAcaoDeColega(label, callback, className = 'button button-quiet') {
  const button = criarElemento('button', className, label);
  button.type = 'button';
  button.addEventListener('click', async () => {
    try {
      await callback();
    } catch (error) {
      console.error(`Não foi possível concluir a ação “${label}”:`, error);
      mostrarAviso('Não foi possível concluir esta ação. Tente novamente.');
    }
  });
  return button;
}

async function renderizarColegas() {
  const userRef = referenciaDeColegas(authenticatedUser.uid);
  const [friendSnapshots, incomingSnapshots, outgoingSnapshots] = await Promise.all([
    userRef.collection('friends').get(),
    userRef.collection('friendRequests').where('status', '==', 'pending').get(),
    obterDb().collectionGroup('friendRequests').where('fromUid', '==', authenticatedUser.uid).get(),
  ]);
  const friends = await Promise.all(friendSnapshots.docs.map(async (snapshot) => ({
    ...await obterNomeDoPerfil(snapshot.id),
    friendship: snapshot.data(),
  })));
  const incoming = await Promise.all(incomingSnapshots.docs.map(async (snapshot) => ({
    ...await obterNomeDoPerfil(snapshot.data().fromUid),
    request: snapshot.data(),
  })));
  const outgoing = await Promise.all(outgoingSnapshots.docs
    .filter((snapshot) => snapshot.data().status === 'pending')
    .map(async (snapshot) => ({
      ...await obterNomeDoPerfil(snapshot.data().toUid),
      request: snapshot.data(),
    })));

  elements.friendsList.replaceChildren(...friends.map((profile) => (
    criarCartaoDeColega(profile, [
      criarAcaoDeColega('Remover', () => removerColega(profile.uid, profile.friendship)),
    ])
  )));
  elements.incomingFriendRequests.replaceChildren(...incoming.map((profile) => (
    criarCartaoDeColega(profile, [
      criarAcaoDeColega('Aceitar', () => responderSolicitacaoDeColega(profile.uid, true), 'button button-primary'),
      criarAcaoDeColega('Recusar', () => responderSolicitacaoDeColega(profile.uid, false)),
    ])
  )));
  elements.outgoingFriendRequests.replaceChildren(...outgoing.map((profile) => (
    criarCartaoDeColega(profile, [
      criarAcaoDeColega('Cancelar solicitação', () => cancelarSolicitacaoDeColega(profile.uid)),
    ])
  )));

  elements.friendsEmpty.classList.toggle('hidden', friends.length > 0);
  elements.incomingRequestsEmpty.classList.toggle('hidden', incoming.length > 0);
  elements.outgoingRequestsEmpty.classList.toggle('hidden', outgoing.length > 0);
}

async function enviarSolicitacaoDeColega(uid) {
  if (!uid || uid === authenticatedUser.uid) return;
  const requestRef = referenciaDeColegas(uid).collection('friendRequests').doc(authenticatedUser.uid);
  const existing = await requestRef.get();
  if (existing.exists) {
    mostrarAviso('Já existe uma solicitação para essa pessoa.');
    return;
  }
  await requestRef.set({
    fromUid: authenticatedUser.uid,
    toUid: uid,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  mostrarAviso('Solicitação de colega enviada.');
  await renderizarAcoesDoPerfil(uid);
}

async function responderSolicitacaoDeColega(senderUid, accept) {
  const requestRef = referenciaDeColegas(authenticatedUser.uid)
    .collection('friendRequests').doc(senderUid);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists || requestSnapshot.data().status !== 'pending') {
    await renderizarColegas();
    return;
  }
  if (!accept) {
    await requestRef.delete();
    mostrarAviso('Solicitação recusada.');
    await renderizarColegas();
    await renderizarAcoesDoPerfil(senderUid);
    return;
  }

  const batch = obterDb().batch();
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();
  const friendship = {
    createdAt: timestamp,
    requestRecipientUid: authenticatedUser.uid,
    requestSenderUid: senderUid,
  };
  batch.update(requestRef, {
    status: 'accepted',
    updatedAt: timestamp,
  });
  batch.set(referenciaDeColegas(authenticatedUser.uid).collection('friends').doc(senderUid), {
    ...friendship,
    uid: senderUid,
  });
  batch.set(referenciaDeColegas(senderUid).collection('friends').doc(authenticatedUser.uid), {
    ...friendship,
    uid: authenticatedUser.uid,
  });

  const reverseRequest = referenciaDeColegas(senderUid)
    .collection('friendRequests').doc(authenticatedUser.uid);
  const reverseSnapshot = await reverseRequest.get();
  if (reverseSnapshot.exists && reverseSnapshot.data().status === 'pending') batch.delete(reverseRequest);
  await batch.commit();
  mostrarAviso('Vocês agora são colegas.');
  await renderizarColegas();
  await renderizarAcoesDoPerfil(senderUid);
}

async function cancelarSolicitacaoDeColega(targetUid) {
  await referenciaDeColegas(targetUid).collection('friendRequests').doc(authenticatedUser.uid).delete();
  mostrarAviso('Solicitação cancelada.');
  await renderizarColegas();
  await renderizarAcoesDoPerfil(targetUid);
}

async function removerColega(friendUid, friendship) {
  const batch = obterDb().batch();
  batch.delete(referenciaDeColegas(authenticatedUser.uid).collection('friends').doc(friendUid));
  batch.delete(referenciaDeColegas(friendUid).collection('friends').doc(authenticatedUser.uid));
  if (friendship?.requestRecipientUid && friendship?.requestSenderUid) {
    batch.delete(referenciaDeColegas(friendship.requestRecipientUid)
      .collection('friendRequests').doc(friendship.requestSenderUid));
  }
  await batch.commit();
  mostrarAviso('Colega removido.');
  await renderizarColegas();
  await renderizarAcoesDoPerfil(friendUid);
}

function obterQuadroDoConviteDePerfil() {
  const requestedBoardId = new URLSearchParams(window.location.search).get('board');
  if (requestedBoardId) return state.boards.find((board) => board.id === requestedBoardId) ?? null;
  return obterQuadroAtual();
}

async function abrirDialogoDeConviteDoPerfil(uid, board) {
  profileBeingInvited = uid;
  elements.profileInviteError.textContent = '';
  elements.profileInviteForm.reset();
  elements.profileInviteBoardName.textContent = `O convite será enviado para “${board.name}”.`;
  elements.profileInviteDialog.showModal();
}

async function enviarConviteDoPerfil(event) {
  event.preventDefault();
  const board = obterQuadroDoConviteDePerfil();
  const uid = profileBeingInvited;
  if (!board || papelDoQuadro(board) !== 'owner' || !uid || uid === authenticatedUser.uid) {
    elements.profileInviteError.textContent = 'Este quadro não está disponível para convite.';
    return;
  }
  const button = elements.profileInviteForm.querySelector('[type="submit"]');
  button.disabled = true;
  elements.profileInviteError.textContent = '';
  try {
    const ref = obterReferenciaDoQuadro(board.id);
    const { role, isShared, ...boardData } = board;
    await ref.set({ ...boardData, ownerId: authenticatedUser.uid, isShared: true }, { merge: true });
    board.isShared = true;
    const memberRef = ref.collection('members').doc(uid);
    const existingInvite = await ref.collection('invites').where('invitedUid', '==', uid).get();
    if ((await memberRef.get()).exists) {
      elements.profileInviteError.textContent = 'Essa pessoa já tem acesso ao quadro.';
      return;
    }
    if (!existingInvite.empty) {
      elements.profileInviteError.textContent = 'Já existe um convite pendente para essa pessoa.';
      return;
    }
    await ref.collection('invites').doc(criarId()).set({
      boardId: board.id,
      boardName: board.name,
      ownerId: authenticatedUser.uid,
      invitedUid: uid,
      role: elements.profileInviteRole.value,
      createdAt: Date.now(),
    });
    elements.profileInviteDialog.close();
    mostrarAviso('Convite do quadro enviado ao perfil.');
    void salvarEstado();
  } catch (error) {
    console.error('Não foi possível convidar o colega para o quadro:', error);
    elements.profileInviteError.textContent = error?.code === 'permission-denied'
      ? 'O Firebase bloqueou o convite. Atualize as regras do Firestore.'
      : 'Não foi possível enviar o convite. Verifique sua conexão e tente novamente.';
  } finally {
    button.disabled = false;
  }
}

async function renderizarAcoesDoPerfil(uid) {
  elements.publicProfileActions.replaceChildren();
  if (uid === authenticatedUser.uid) return;

  const userRef = referenciaDeColegas(authenticatedUser.uid);
  const [friend, incoming, outgoing] = await Promise.all([
    userRef.collection('friends').doc(uid).get(),
    userRef.collection('friendRequests').doc(uid).get(),
    referenciaDeColegas(uid).collection('friendRequests').doc(authenticatedUser.uid).get(),
  ]);
  const actions = criarElemento('div', 'profile-action-row');
  if (friend.exists) {
    actions.append(criarAcaoDeColega('Remover colega', () => removerColega(uid, friend.data())));
  } else if (incoming.exists && incoming.data().status === 'pending') {
    actions.append(
      criarAcaoDeColega('Aceitar solicitação', () => responderSolicitacaoDeColega(uid, true), 'button button-primary'),
      criarAcaoDeColega('Recusar', () => responderSolicitacaoDeColega(uid, false)),
    );
  } else if (outgoing.exists && outgoing.data().status === 'pending') {
    actions.append(criarElemento('span', 'confirm-message', 'Solicitação enviada'));
    actions.append(criarAcaoDeColega('Cancelar', () => cancelarSolicitacaoDeColega(uid)));
  } else {
    actions.append(criarAcaoDeColega(
      'Adicionar aos colegas',
      async () => {
        try {
          await enviarSolicitacaoDeColega(uid);
        } catch (error) {
          console.error('Não foi possível enviar a solicitação de colega:', error);
          mostrarAviso('Não foi possível enviar a solicitação. Tente novamente.');
        }
      },
      'button button-primary',
    ));
  }

  const board = obterQuadroDoConviteDePerfil();
  if (board && board.ownerId === authenticatedUser.uid) {
    actions.append(criarAcaoDeColega(
      `Convidar para “${board.name}”`,
      () => abrirDialogoDeConviteDoPerfil(uid, board),
    ));
  }
  elements.publicProfileActions.append(actions);
}

async function abrirRotaAutenticada() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/home';
  const taskRoute = /^\/tasks\/[^/]+$/.test(path);
  const boardRoute = path.match(/^\/quadros\/([^/]+)$/);
  const profileRoute = path.match(/^\/perfil\/([^/]+)$/);

  elements.homePage.classList.add('hidden');
  elements.colleaguesPage.classList.add('hidden');
  elements.boardsPage.classList.add('hidden');
  elements.profilePage.classList.add('hidden');
  elements.publicProfilePage.classList.add('hidden');
  elements.boardPage.classList.add('hidden');
  elements.taskPage.classList.add('hidden');
  elements.boardTools.classList.toggle('hidden', !boardRoute);
  elements.boardContent.classList.remove('hidden');
  elements.boardNotFound.classList.add('hidden');

  if (taskRoute) {
    elements.appShell.classList.add('hidden');
    elements.taskPage.classList.remove('hidden');
    atualizarNavegacaoAtiva('');
    await abrirTaskDaUrl();
    return;
  }

  elements.appShell.classList.remove('hidden');
  if (path === '/' || path === '/home') {
    atualizarNavegacaoAtiva('home');
    try {
      await carregarMeuPerfil();
      elements.homePage.classList.remove('hidden');
    } catch (error) {
      console.error('Não foi possível carregar o perfil:', error);
      elements.homeUserName.textContent = authenticatedUser.displayName || 'ao Fluxo';
      elements.homePage.classList.remove('hidden');
    }
    return;
  }

  if (path === '/quadros') {
    atualizarNavegacaoAtiva('boards');
    renderizarListaDeQuadros();
    elements.boardsPage.classList.remove('hidden');
    return;
  }

  if (path === '/colegas') {
    atualizarNavegacaoAtiva('colleagues');
    elements.colleaguesError.textContent = '';
    elements.colleaguesPage.classList.remove('hidden');
    try {
      await renderizarColegas();
    } catch (error) {
      console.error('Não foi possível carregar colegas:', error);
      elements.colleaguesError.textContent = 'Não foi possível carregar seus colegas. Verifique as regras e tente novamente.';
    }
    return;
  }

  if (boardRoute) {
    const board = state.boards.find((item) => item.id === boardRoute[1]);
    atualizarNavegacaoAtiva('boards');
    elements.boardPage.classList.remove('hidden');
    if (!board) {
      elements.boardContent.classList.add('hidden');
      elements.boardNotFound.classList.remove('hidden');
      return;
    }
    state.activeBoardId = board.id;
    renderizar();
    return;
  }

  if (path === '/perfil') {
    atualizarNavegacaoAtiva('profile');
    elements.profileError.textContent = '';
    try {
      await carregarMeuPerfil();
      elements.profilePage.classList.remove('hidden');
    } catch (error) {
      console.error('Não foi possível carregar seu perfil:', error);
      elements.profileError.textContent = 'Não foi possível carregar seu perfil. Verifique sua conexão e tente novamente.';
      elements.profilePage.classList.remove('hidden');
    }
    return;
  }

  if (profileRoute) {
    atualizarNavegacaoAtiva('profile');
    elements.publicProfileCard.classList.add('hidden');
    elements.publicProfileActions.replaceChildren();
    elements.publicProfileMessage.textContent = 'Carregando perfil...';
    elements.publicProfilePage.classList.remove('hidden');
    try {
      const snapshot = await obterDb().collection('profiles').doc(profileRoute[1]).get();
      if (!snapshot.exists) {
        elements.publicProfileMessage.textContent = 'Perfil não encontrado ou ainda não publicado.';
        return;
      }
      const profile = snapshot.data();
      elements.publicProfileName.textContent = profile.displayName;
      elements.publicProfileBio.textContent = profile.bio || 'Esta pessoa ainda não adicionou uma biografia.';
      elements.publicProfileCard.classList.remove('hidden');
      elements.publicProfileMessage.textContent = '';
      await renderizarAcoesDoPerfil(profileRoute[1]);
    } catch (error) {
      console.error('Não foi possível abrir este perfil:', error);
      elements.publicProfileMessage.textContent = 'Não foi possível abrir este perfil. Verifique sua conexão e tente novamente.';
    }
    return;
  }

  atualizarNavegacaoAtiva('');
  elements.homePage.classList.remove('hidden');
}

function atualizarSeletorDeSprints(board) {
  const sprints = Array.isArray(board.sprints) ? board.sprints : [];
  const options = [new Option('Backlog', '')];
  sprints.forEach((sprint) => options.push(new Option(sprint.name, sprint.id)));
  elements.sprintFilter.replaceChildren(...options);
  elements.sprintFilter.value = board.activeSprintId || '';
  elements.sprintFilter.disabled = sprints.length === 0;
  const backlogCount = board.tasks.filter((task) => !task.sprintId).length;
  elements.backlogSummary.textContent = `${backlogCount} ${backlogCount === 1 ? 'atividade' : 'atividades'} no backlog`;
}

function atualizarSeletorDeQuadros() {
  const owned = state.boards.filter((board) => board.ownerId === authenticatedUser?.uid);
  const shared = state.boards.filter((board) => board.ownerId !== authenticatedUser?.uid);
  const groups = [];
  if (owned.length) groups.push(['Meus quadros', owned]);
  if (shared.length) groups.push(['Compartilhados comigo', shared]);
  const options = groups.map(([label, boards]) => {
    const group = document.createElement('optgroup');
    group.label = label;
    boards.forEach((board) => {
      const option = document.createElement('option');
      option.value = board.id;
      option.textContent = board.name;
      option.selected = board.id === state.activeBoardId;
      group.append(option);
    });
    return group;
  });
  elements.boardSelect.replaceChildren(...options);
  const board = obterQuadroAtual();
  document.querySelector('#delete-board').title = board?.ownerId === authenticatedUser?.uid
    ? (owned.length > 1 ? 'Excluir quadro' : 'O último quadro não pode ser excluído')
    : 'Somente o dono pode excluir este quadro';
}

function renderizarConfiguracaoColunas() {
  const board = obterQuadroAtual();
  elements.columnSettingsList.replaceChildren();
  editingColumns.forEach((column) => {
    const row = criarElemento('div', 'column-setting-row');
    const nameLabel = criarElemento('label', '', 'Nome da coluna');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 30;
    nameInput.value = column.name;
    nameInput.dataset.nameFor = column.id;
    nameLabel.append(nameInput);
    const limitLabel = criarElemento('label', '', 'Limite WIP');
    const limitInput = document.createElement('input');
    limitInput.type = 'number';
    limitInput.min = '0';
    limitInput.max = '100';
    limitInput.value = String(column.limit || 0);
    limitInput.dataset.limitFor = column.id;
    limitLabel.append(limitInput);
    const remove = criarElemento('button', 'button button-quiet', 'Remover');
    remove.type = 'button';
    remove.disabled = board.tasks.some((task) => task.column === column.id);
    remove.addEventListener('click', () => {
      editingColumns = editingColumns.filter((item) => item.id !== column.id);
      renderizarConfiguracaoColunas();
    });
    row.append(nameLabel, limitLabel, remove);
    elements.columnSettingsList.append(row);
  });
}

function abrirConfiguracaoColunas() {
  const board = obterQuadroAtual();
  if (!board || !podeEditarQuadro(board)) return;
  editingColumns = (board.columns ?? COLUMNS).map((column) => ({ ...column, limit: column.limit || 0 }));
  renderizarConfiguracaoColunas();
  elements.columnsForm.reset();
  elements.newColumnLimit.value = '0';
  elements.columnsDialog.showModal();
}

function ensureBoardSubscription(board) {
  if (!board.isShared) {
    boardSubscription?.();
    boardSubscription = null;
    subscribedBoardId = null;
    historySubscription?.();
    historySubscription = null;
    subscribedHistoryKey = null;
    commentsSubscription?.();
    commentsSubscription = null;
    activeTaskId = null;
    activeTaskBoardId = null;
    return;
  }
  if (subscribedBoardId === board.id) return;
  boardSubscription?.();
  subscribedBoardId = board.id;
  boardSubscription = obterReferenciaDoQuadro(board.id).onSnapshot((snapshot) => {
    if (!snapshot.exists || !state) return;
    const current = state.boards.find((item) => item.id === board.id);
    if (!current) return;
    const role = current.role;
    Object.assign(current, snapshot.data(), { id: snapshot.id, role, isShared: true });
    renderizar();
    if (activeTaskBoardId === current.id) renderizarPaginaDaTask();
  }, (error) => {
    console.error('Não foi possível acompanhar as alterações do quadro compartilhado:', error);
    elements.saveStatus.textContent = 'Falha ao receber atualizações do quadro';
    elements.saveStatus.classList.add('has-error');
  });
}

function ensureHistorySubscription(board) {
  const key = `${board.isShared ? 'shared' : authenticatedUser.uid}:${board.id}`;
  if (subscribedHistoryKey === key) return;
  historySubscription?.();
  subscribedHistoryKey = key;
  const collection = board.isShared
    ? obterReferenciaDoQuadro(board.id).collection('activity')
    : obterDb().collection('users').doc(authenticatedUser.uid).collection('kanban').doc(board.id).collection('activity');
  historySubscription = collection.orderBy('createdAt', 'desc').limit(15).onSnapshot((snapshot) => {
    elements.boardHistoryList.replaceChildren();
    snapshot.docs.forEach((entry) => {
      const data = entry.data();
      const row = criarElemento('div', 'board-history-item');
      row.append(
        criarElemento('span', '', `${data.actorEmail || 'Usuário'} — ${data.message}`),
        criarElemento('time', '', new Date(data.createdAt).toLocaleString('pt-BR')),
      );
      elements.boardHistoryList.append(row);
    });
    if (!snapshot.docs.length) elements.boardHistoryList.append(criarElemento('p', 'confirm-message', 'Ainda não há alterações registradas.'));
  }, (error) => {
    console.error('Não foi possível carregar o histórico do quadro:', error);
    elements.boardHistoryList.replaceChildren(criarElemento('p', 'form-message error', 'Não foi possível carregar o histórico.'));
  });
}

function localizarTask(taskId, boardId) {
  const boards = boardId
    ? state.boards.filter((board) => board.id === boardId)
    : state.boards;
  for (const board of boards) {
    const task = board.tasks.find((item) => item.id === taskId);
    if (task) return { board, task };
  }
  return null;
}

function renderizarPaginaDaTask() {
  const found = localizarTask(activeTaskId, activeTaskBoardId);
  if (!found) {
    elements.taskPageTitle.textContent = 'Atividade não encontrada';
    elements.taskPageDescription.textContent = 'Ela pode ter sido removida ou você não tem mais acesso ao quadro.';
    elements.taskPageMeta.replaceChildren();
    elements.taskPageChecklist.replaceChildren();
    elements.taskComments.replaceChildren();
    return;
  }
  const { board, task } = found;
  elements.taskPageTitle.textContent = task.title;
  elements.taskPageDescription.textContent = task.description || 'Sem descrição.';
  elements.taskPageEdit.classList.toggle('hidden', !podeEditarQuadro(board));
  elements.taskPageMeta.replaceChildren();
  [
    `Quadro: ${board.name}`,
    `Prioridade: ${PRIORITIES[task.priority] || 'Média'}`,
    task.deadline ? `Prazo: ${task.deadline}` : null,
    task.assigneeEmail ? `Responsável: ${task.assigneeEmail}` : null,
    task.storyPoints ? `${task.storyPoints} story points` : null,
    task.sprintId ? `Sprint: ${board.sprints?.find((sprint) => sprint.id === task.sprintId)?.name || 'Sprint'}` : 'Backlog',
  ].filter(Boolean).forEach((value) => elements.taskPageMeta.append(criarElemento('span', '', value)));
  (task.labels || []).forEach((label) => elements.taskPageMeta.append(criarElemento('span', 'task-label', label)));
  if (task.acceptanceCriteria) {
    elements.taskPageMeta.append(criarElemento('span', 'task-label', `Aceite: ${task.acceptanceCriteria}`));
  }
  if (task.definitionOfDone) {
    elements.taskPageMeta.append(criarElemento('span', 'task-label', `Definition of Done: ${task.definitionOfDone}`));
  }
  elements.taskPageChecklist.replaceChildren();
  (task.checklist || []).forEach((item, index) => {
    const row = criarElemento('label', 'task-check-item');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.done === true;
    checkbox.disabled = !podeEditarQuadro(board);
    checkbox.addEventListener('change', () => {
      task.checklist[index].done = checkbox.checked;
      void salvarEstado('Atualizou o checklist');
      renderizarPaginaDaTask();
    });
    row.append(checkbox, criarElemento('span', '', item.text));
    elements.taskPageChecklist.append(row);
  });
  if (!(task.checklist || []).length) {
    elements.taskPageChecklist.append(criarElemento('p', 'confirm-message', 'Nenhum item no checklist.'));
  }
}

async function abrirTaskDaUrl() {
  const match = window.location.pathname.match(/^\/tasks\/([^/]+)\/?$/);
  if (!match) {
    commentsSubscription?.();
    commentsSubscription = null;
    activeTaskId = null;
    activeTaskBoardId = null;
    return;
  }
  activeTaskId = decodeURIComponent(match[1]);
  activeTaskBoardId = new URLSearchParams(window.location.search).get('board');
  elements.taskPageBack.href = activeTaskBoardId
    ? `/quadros/${encodeURIComponent(activeTaskBoardId)}`
    : '/quadros';
  const found = localizarTask(activeTaskId, activeTaskBoardId);
  if (!found) {
    elements.taskPage.classList.remove('hidden');
    elements.appShell.classList.add('hidden');
    renderizarPaginaDaTask();
    return;
  }
  activeTaskBoardId = found.board.id;
  elements.taskPageBack.href = `/quadros/${encodeURIComponent(found.board.id)}`;
  state.activeBoardId = found.board.id;
  if (!found.board.isShared && papelDoQuadro(found.board) === 'owner') {
    try {
      const { role, isShared, ...boardData } = found.board;
      await obterReferenciaDoQuadro(found.board.id).set({
        ...boardData,
        ownerId: authenticatedUser.uid,
        isShared: true,
      }, { merge: true });
      found.board.isShared = true;
      ensureBoardSubscription(found.board);
      ensureHistorySubscription(found.board);
    } catch (error) {
      console.error('Não foi possível preparar a atividade para o modo compartilhado:', error);
      mostrarAviso('Não foi possível abrir os comentários. Verifique as regras do Firestore.');
    }
  }
  elements.appShell.classList.add('hidden');
  elements.taskPage.classList.remove('hidden');
  renderizarPaginaDaTask();
  commentsSubscription?.();
  commentsSubscription = obterReferenciaDoQuadro(found.board.id)
    .collection('tasks').doc(found.task.id).collection('comments')
    .onSnapshot((snapshot) => {
      const comments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((first, second) => first.createdAt - second.createdAt);
      elements.taskComments.replaceChildren();
      comments.forEach((comment) => {
        const item = criarElemento('article', 'task-comment');
        item.append(
          criarElemento('p', 'task-comment-meta', `${comment.authorEmail} · ${new Date(comment.createdAt).toLocaleString('pt-BR')}`),
          criarElemento('p', '', comment.text),
        );
        elements.taskComments.append(item);
      });
      if (!comments.length) elements.taskComments.append(criarElemento('p', 'confirm-message', 'Ainda não há comentários.'));
    }, (error) => {
      console.error('Não foi possível carregar os comentários:', error);
      elements.taskComments.replaceChildren(criarElemento('p', 'form-message error', 'Não foi possível carregar os comentários deste quadro.'));
    });
}

async function adicionarComentario(event) {
  event.preventDefault();
  const text = elements.commentText.value.trim();
  if (!text || !activeTaskId || !activeTaskBoardId || !authenticatedUser?.email) return;
  if (!localizarTask(activeTaskId, activeTaskBoardId)) {
    mostrarAviso('A atividade não está mais disponível para comentar.');
    return;
  }
  const button = elements.commentForm.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    await obterReferenciaDoQuadro(activeTaskBoardId).collection('tasks').doc(activeTaskId)
      .collection('comments').add({
        authorId: authenticatedUser.uid,
        authorEmail: authenticatedUser.email,
        text,
        createdAt: Date.now(),
      });
    elements.commentForm.reset();
  } catch (error) {
    console.error('Não foi possível enviar o comentário:', error);
    mostrarAviso(error?.code === 'permission-denied'
      ? 'Você não tem acesso para comentar nesta atividade.'
      : 'Não foi possível enviar o comentário. Tente novamente.');
  } finally {
    button.disabled = false;
  }
}

async function abrirCompartilhamentoDoQuadro() {
  const board = obterQuadroAtual();
  if (!board || papelDoQuadro(board) !== 'owner') return;
  elements.shareError.textContent = '';
  elements.shareForm.reset();
  elements.shareDialog.showModal();
  try {
    await carregarAcessosDoQuadro(board);
  } catch (error) {
    console.error('Não foi possível carregar os acessos do quadro:', error);
    elements.shareError.textContent = 'Não foi possível carregar os acessos. Verifique as regras do Firestore.';
  }
}

function criarLinhaDeAcesso(label, role, onRemove, profileUid, profileBoardId) {
  const row = criarElemento('div', 'member-row');
  row.append(criarElemento('span', 'member-email', label));
  if (profileUid) {
    const profileLink = criarElemento('a', 'member-profile-link', 'Ver perfil');
    profileLink.href = `/perfil/${encodeURIComponent(profileUid)}?board=${encodeURIComponent(profileBoardId)}`;
    row.append(profileLink);
  }
  row.append(criarElemento('span', 'member-role', role));
  if (onRemove) {
    const remove = criarElemento('button', 'button button-quiet', 'Remover');
    remove.type = 'button';
    remove.addEventListener('click', () => void onRemove());
    row.append(remove);
  }
  elements.boardMembers.append(row);
}

async function carregarAcessosDoQuadro(board) {
  const ref = obterReferenciaDoQuadro(board.id);
  if (board.isShared) {
    const [members, invites] = await Promise.all([
      ref.collection('members').get(),
      ref.collection('invites').get(),
    ]);
    boardMembers = members.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
    boardInvitations = invites.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  } else {
    boardMembers = [];
    boardInvitations = [];
  }
  elements.boardMembers.replaceChildren();
  criarLinhaDeAcesso(authenticatedUser.email || 'Você', 'Dono', null, authenticatedUser.uid, board.id);
  boardMembers.forEach((member) => {
    criarLinhaDeAcesso(
      member.email,
      member.role === 'editor' ? 'Editor' : 'Leitor',
      async () => {
        await ref.collection('members').doc(member.id).delete();
        await carregarAcessosDoQuadro(board);
        mostrarAviso('Acesso removido.');
      },
      member.uid,
      board.id,
    );
  });
  boardInvitations.forEach((invite) => {
    criarLinhaDeAcesso(
      invite.invitedEmail || 'Colega por perfil',
      `${invite.role === 'editor' ? 'Editor' : 'Leitor'} · aguardando aceitação`,
      async () => {
        await ref.collection('invites').doc(invite.id).delete();
        await carregarAcessosDoQuadro(board);
        mostrarAviso('Convite cancelado.');
      },
    );
  });
}

async function excluirQuadroCompartilhado(board) {
  const db = obterDb();
  const ref = obterReferenciaDoQuadro(board.id);
  const references = [];
  const [members, invites, activities] = await Promise.all([
    ref.collection('members').get(),
    ref.collection('invites').get(),
    ref.collection('activity').get(),
  ]);
  references.push(...members.docs, ...invites.docs, ...activities.docs);
  for (const task of board.tasks) {
    const comments = await ref.collection('tasks').doc(task.id).collection('comments').get();
    references.push(...comments.docs);
  }
  for (let index = 0; index < references.length; index += 450) {
    const batch = db.batch();
    references.slice(index, index + 450).forEach((snapshot) => batch.delete(snapshot.ref));
    await batch.commit();
  }
  await ref.delete();
}

async function convidarParaQuadro(event) {
  event.preventDefault();
  const board = obterQuadroAtual();
  const email = elements.shareEmail.value.trim().toLowerCase();
  const role = elements.shareRole.value;
  if (!board || papelDoQuadro(board) !== 'owner') return;
  if (!elements.shareEmail.validity.valid) {
    elements.shareError.textContent = 'Informe um endereço de e-mail válido.';
    return;
  }
  if (email === authenticatedUser.email?.trim().toLowerCase()) {
    elements.shareError.textContent = 'Você já é o dono deste quadro.';
    return;
  }

  const button = elements.shareForm.querySelector('[type="submit"]');
  button.disabled = true;
  elements.shareError.textContent = '';
  try {
    const ref = obterReferenciaDoQuadro(board.id);
    const { role: ignoredRole, isShared, ...boardData } = board;
    await ref.set({ ...boardData, ownerId: authenticatedUser.uid, isShared: true }, { merge: true });
    board.isShared = true;
    const existing = await ref.collection('invites').where('invitedEmail', '==', email).get();
    const existingMember = await ref.collection('members').where('email', '==', email).get();
    if (!existing.empty) {
      elements.shareError.textContent = 'Já existe um convite pendente para esse e-mail.';
      return;
    }
    if (!existingMember.empty) {
      elements.shareError.textContent = 'Essa pessoa já tem acesso. Remova o acesso atual antes de enviar um novo convite que exija aceitação.';
      return;
    }
    const inviteId = criarId();
    await ref.collection('invites').doc(inviteId).set({
      boardId: board.id,
      boardName: board.name,
      ownerId: authenticatedUser.uid,
      invitedEmail: email,
      role,
      createdAt: Date.now(),
    });
    await carregarAcessosDoQuadro(board);
    elements.shareEmail.value = '';
    mostrarAviso(`Convite criado para ${email}. Ele aparecerá no Fluxo quando a pessoa entrar com essa conta.`);
    void salvarEstado();
  } catch (error) {
    console.error('Não foi possível compartilhar o quadro:', error);
    elements.shareError.textContent = error?.code === 'permission-denied'
      ? 'O Firestore bloqueou o compartilhamento. Atualize as regras usando firestore.rules.'
      : 'Não foi possível enviar o convite. Verifique sua conexão e tente novamente.';
  } finally {
    button.disabled = false;
  }
}

function criarColuna(column, columnIndex, tasks) {
  const canEdit = podeEditarQuadro();
  const section = criarElemento('section', 'kanban-column');
  section.dataset.column = column.id;
  section.setAttribute('aria-label', `Coluna ${column.name}`);

  const heading = criarElemento('div', 'column-heading');
  const titleWrap = criarElemento('div', 'column-title-wrap');
  const indicator = criarElemento('span', `column-indicator ${column.className}`);
  indicator.setAttribute('aria-hidden', 'true');
  const title = criarElemento('h2', 'column-title', column.name);
  const countLabel = column.limit > 0 ? `${tasks.length}/${column.limit}` : String(tasks.length);
  const count = criarElemento('span', 'column-count', countLabel);
  count.setAttribute('aria-label', `${tasks.length} atividades`);
  titleWrap.append(indicator, title, count);
  heading.append(titleWrap);

  const addButton = criarElemento('button', 'add-task', '+ Adicionar atividade');
  addButton.type = 'button';
  addButton.dataset.addTo = column.id;
  addButton.disabled = !canEdit || (column.limit > 0 && tasks.length >= column.limit);
  if (column.limit > 0) addButton.title = `Limite de WIP: ${column.limit}`;
  const columns = obterQuadroAtual().columns ?? COLUMNS;
  const atWipLimit = (targetColumnId) => {
    const target = columns.find((item) => item.id === targetColumnId);
    const activeSprintId = obterQuadroAtual().activeSprintId || '';
    return target?.limit > 0
      && obterQuadroAtual().tasks.filter((task) => (
        task.column === targetColumnId && (task.sprintId || '') === activeSprintId
      )).length >= target.limit;
  };
  const taskList = criarElemento('div', 'task-list');
  taskList.dataset.dropColumn = column.id;
  if (tasks.length === 0) {
    taskList.append(criarElemento('p', 'empty-state', 'Nenhuma atividade por aqui'));
  } else {
    tasks.forEach((task) => taskList.append(criarCartao(task, columnIndex, atWipLimit)));
  }
  section.append(heading, addButton, taskList);
  return section;
}

function criarCartao(task, columnIndex, atWipLimit) {
  const canEdit = podeEditarQuadro();
  const columns = obterQuadroAtual().columns ?? COLUMNS;
  const card = criarElemento('article', 'task-card');
  card.dataset.taskId = task.id;
  card.dataset.priority = Object.hasOwn(PRIORITIES, task.priority) ? task.priority : 'medium';
  card.draggable = canEdit;
  card.setAttribute('aria-label', `${task.title}, prioridade ${PRIORITIES[card.dataset.priority]}`);

  const title = criarElemento('h3', 'task-title', task.title);
  const description = criarElemento('p', 'task-description', task.description);
  const priority = criarElemento('span', 'priority-label', PRIORITIES[card.dataset.priority]);
  const taskMeta = criarElemento('div', 'task-card-meta');
  if (task.deadline) taskMeta.append(criarElemento('span', '', `Prazo: ${task.deadline}`));
  if (task.assigneeEmail) taskMeta.append(criarElemento('span', '', task.assigneeEmail));
  if (task.storyPoints) taskMeta.append(criarElemento('span', '', `${task.storyPoints} pts`));
  if (task.checklist?.length) {
    const completed = task.checklist.filter((item) => item.done).length;
    taskMeta.append(criarElemento('span', '', `Checklist ${completed}/${task.checklist.length}`));
  }
  (task.labels ?? []).forEach((label) => taskMeta.append(criarElemento('span', 'task-label', label)));
  const taskLink = criarElemento('a', 'task-open-link', 'Abrir atividade em nova aba');
  taskLink.href = `/tasks/${encodeURIComponent(task.id)}?board=${encodeURIComponent(obterQuadroAtual().id)}`;
  taskLink.target = '_blank';
  taskLink.rel = 'noopener noreferrer';
  const actions = criarElemento('div', 'card-actions');
  actions.append(
    criarBotao('←', 'Mover para a coluna anterior', 'move-previous', 'previous', !canEdit || columnIndex === 0),
    criarBotao('→', 'Mover para a próxima coluna', 'move-next', 'next', !canEdit || columnIndex === columns.length - 1 || atWipLimit(columns[columnIndex + 1]?.id)),
    criarBotao('✎', 'Editar atividade', 'edit', 'edit', !canEdit),
    criarBotao('×', 'Excluir atividade', 'delete', 'delete', !canEdit),
  );
  card.append(title, description, priority, taskMeta, taskLink, actions);
  return card;
}

function abrirFormularioDeAtividade(columnId, task = null) {
  if (!podeEditarQuadro()) return;
  taskBeingEdited = task?.id ?? null;
  elements.taskForm.reset();
  elements.taskForm.elements.deadline.value = task?.deadline ?? '';
  elements.taskForm.elements.labels.value = (task?.labels ?? []).join(', ');
  elements.taskForm.elements.storyPoints.value = task?.storyPoints ?? '';
  elements.taskForm.elements.acceptanceCriteria.value = task?.acceptanceCriteria ?? '';
  elements.taskForm.elements.definitionOfDone.value = task?.definitionOfDone ?? '';
  elements.taskForm.elements.checklist.value = (task?.checklist ?? []).map((item) => item.text).join('\n');
  const sprintSelect = elements.taskForm.elements.sprintId;
  const board = obterQuadroAtual();
  sprintSelect.replaceChildren(new Option('Backlog', ''));
  (board.sprints ?? []).forEach((sprint) => sprintSelect.add(new Option(sprint.name, sprint.id)));
  sprintSelect.value = task?.sprintId ?? board.activeSprintId ?? '';
  elements.taskForm.elements.title.value = task?.title ?? '';
  elements.taskForm.elements.description.value = task?.description ?? '';
  elements.taskForm.elements.priority.value = task?.priority ?? 'medium';
  elements.taskForm.dataset.column = task?.column ?? columnId;
  elements.taskDialogTitle.textContent = task ? 'Editar atividade' : 'Nova atividade';
  elements.taskDialog.querySelector('[type="submit"]').textContent = task ? 'Salvar alterações' : 'Salvar atividade';
  elements.taskDialog.showModal();
  elements.taskForm.elements.title.focus();
  void carregarResponsaveisDoQuadro(task?.assigneeId);
}

async function carregarResponsaveisDoQuadro(selectedId = '') {
  const select = elements.taskForm.elements.assignee;
  const board = obterQuadroAtual();
  select.replaceChildren(new Option('Não atribuído', ''));
  const ownerOption = new Option(authenticatedUser.email || 'Dono do quadro', authenticatedUser.uid);
  ownerOption.dataset.email = authenticatedUser.email || '';
  select.add(ownerOption);
  if (board.isShared) {
    try {
      const members = await obterReferenciaDoQuadro(board.id).collection('members').get();
      members.docs.forEach((snapshot) => {
        const member = snapshot.data();
        const option = new Option(member.email, member.uid);
        option.dataset.email = member.email;
        select.add(option);
      });
    } catch (error) {
      console.error('Não foi possível carregar os membros para atribuição:', error);
    }
  }
  select.value = selectedId;
}

function abrirFormularioDeQuadro(rename = false) {
  if (rename && papelDoQuadro(obterQuadroAtual()) !== 'owner') return;
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
  if (!podeEditarQuadro()) return;
  const board = obterQuadroAtual();
  const task = board.tasks.find((item) => item.id === taskId);
  const columns = board.columns ?? COLUMNS;
  const destination = columns.find((column) => column.id === columnId);
  if (!task || !destination) return;
  const activeSprintId = board.activeSprintId || '';
  const destinationCount = board.tasks.filter((item) => (
    item.column === columnId && (item.sprintId || '') === activeSprintId
  )).length;
  if (destination.limit > 0 && destinationCount >= destination.limit) {
    mostrarAviso(`A coluna “${destination.name}” atingiu o limite de WIP (${destination.limit}).`);
    return;
  }
  task.column = columnId;
  salvarEstado(`Moveu “${task.title}” para ${columns.find((column) => column.id === columnId).name}`);
  renderizar();
}

function mostrarAviso(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 3500);
}

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const userValue = elements.loginUser.value.trim();
  const passwordValue = elements.loginPassword.value;

  if (!userValue || !passwordValue) {
    exibirMensagemErro('Informe o e-mail e a senha para continuar.');
    return;
  }

  if (elements.loginUser.validity.typeMismatch) {
    exibirMensagemErro('Informe um endereço de e-mail válido.');
    elements.loginUser.focus();
    return;
  }

  if (passwordValue.length < 6) {
    exibirMensagemErro('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  const submitButtons = elements.loginForm.querySelectorAll('button[type="submit"]');
  submitButtons.forEach((button) => {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Aguarde...';
  });
  elements.loginForm.setAttribute('aria-busy', 'true');
  limparMensagemErro();

  try {
    await autenticarUsuario(userValue, passwordValue);
    elements.loginForm.reset();
    elements.loginPassword.type = 'password';
    elements.togglePassword.textContent = 'Mostrar';
    elements.togglePassword.setAttribute('aria-label', 'Mostrar senha');
  } catch (error) {
    console.error('Falha na autenticação do Firebase:', error);
    exibirMensagemErro(traduzirErroDeAutenticacao(error));
  } finally {
    submitButtons.forEach((button) => {
      button.disabled = false;
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    });
    elements.loginForm.removeAttribute('aria-busy');
  }
});

elements.registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = elements.registerEmail.value.trim();
  const password = elements.registerPassword.value;
  const confirmation = elements.registerConfirmPassword.value;

  if (!email || !password || !confirmation) {
    elements.registerError.textContent = 'Preencha todos os campos para criar sua conta.';
    return;
  }
  if (elements.registerEmail.validity.typeMismatch) {
    elements.registerError.textContent = 'Informe um endereço de e-mail válido.';
    elements.registerEmail.focus();
    return;
  }
  if (password.length < 6) {
    elements.registerError.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
    elements.registerPassword.focus();
    return;
  }
  if (password !== confirmation) {
    elements.registerError.textContent = 'As senhas não coincidem. Confira e tente novamente.';
    elements.registerConfirmPassword.focus();
    return;
  }

  const submitButton = elements.registerForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.dataset.originalText = submitButton.textContent;
  submitButton.textContent = 'Criando conta...';
  elements.registerForm.setAttribute('aria-busy', 'true');
  elements.registerError.textContent = '';

  try {
    await autenticarUsuario(email, password, true);
    elements.registerForm.reset();
  } catch (error) {
    console.error('Falha ao criar conta no Firebase:', error);
    elements.registerError.textContent = traduzirErroDeAutenticacao(error, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.originalText;
    delete submitButton.dataset.originalText;
    elements.registerForm.removeAttribute('aria-busy');
  }
});

elements.passwordResetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = elements.resetEmail.value.trim();
  if (!email || elements.resetEmail.validity.typeMismatch) {
    elements.passwordResetMessage.textContent = 'Informe um endereço de e-mail válido.';
    elements.passwordResetMessage.classList.add('error');
    elements.resetEmail.focus();
    return;
  }

  const auth = obterAuth();
  if (!auth) {
    elements.passwordResetMessage.textContent = 'O Firebase não está configurado. Atualize a página ou fale com o administrador.';
    elements.passwordResetMessage.classList.add('error');
    return;
  }

  const submitButton = elements.passwordResetForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.dataset.originalText = submitButton.textContent;
  submitButton.textContent = 'Enviando...';
  elements.passwordResetForm.setAttribute('aria-busy', 'true');
  elements.passwordResetMessage.textContent = '';
  elements.passwordResetMessage.classList.remove('error', 'success');

  try {
    await auth.sendPasswordResetEmail(email);
    elements.passwordResetMessage.textContent = 'Se houver uma conta associada a esse e-mail, você receberá um link para redefinir sua senha.';
    elements.passwordResetMessage.classList.add('success');
  } catch (error) {
    console.error('Falha ao solicitar redefinição de senha no Firebase:', error);
    if (error?.code === 'auth/user-not-found') {
      elements.passwordResetMessage.textContent = 'Se houver uma conta associada a esse e-mail, você receberá um link para redefinir sua senha.';
      elements.passwordResetMessage.classList.add('success');
    } else {
      const messages = {
        'auth/invalid-email': 'Informe um endereço de e-mail válido.',
        'auth/operation-not-allowed': 'A redefinição de senha por e-mail não está habilitada no Firebase. Peça ao administrador para verificar as configurações de autenticação.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
        'auth/network-request-failed': 'Falha de conexão. Verifique sua internet e tente novamente.',
        'auth/invalid-api-key': 'A configuração do Firebase está inválida. Peça ao administrador para verificar a chave de API.',
        'auth/app-not-authorized': 'Este domínio não está autorizado no Firebase. Peça ao administrador para adicioná-lo aos domínios autorizados.',
        'auth/unauthorized-domain': 'Este domínio não está autorizado no Firebase. Peça ao administrador para adicioná-lo aos domínios autorizados.',
      };
      elements.passwordResetMessage.textContent = messages[error?.code]
        || 'Não foi possível solicitar a redefinição agora. Tente novamente.';
      elements.passwordResetMessage.classList.add('error');
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.originalText;
    delete submitButton.dataset.originalText;
    elements.passwordResetForm.removeAttribute('aria-busy');
  }
});

elements.showRegisterButton.addEventListener('click', mostrarFormularioDeCadastro);
elements.showLoginButton.addEventListener('click', mostrarFormularioDeLogin);
elements.showPasswordResetButton.addEventListener('click', mostrarFormularioDeRedefinicao);
elements.backToLoginButton.addEventListener('click', () => {
  elements.loginUser.value = elements.resetEmail.value.trim();
  mostrarFormularioDeLogin();
});
elements.togglePassword.addEventListener('click', alternarVisibilidadeSenha);

elements.logoutButton.addEventListener('click', encerrarSessao);
elements.loadingLogoutButton.addEventListener('click', encerrarSessao);
elements.useDeviceDataButton.addEventListener('click', usarDadosDoDispositivo);
elements.useCloudDataButton.addEventListener('click', usarDadosDoFirebase);
elements.retryLoadButton.addEventListener('click', () => {
  const auth = obterAuth();
  if (auth?.currentUser) void sincronizarSessao(auth.currentUser);
});

elements.profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const displayName = elements.profileDisplayName.value.trim();
  const bio = elements.profileBio.value.trim();
  if (!displayName) {
    elements.profileError.textContent = 'Informe um nome de exibição.';
    elements.profileDisplayName.focus();
    return;
  }

  const button = elements.profileForm.querySelector('[type="submit"]');
  button.disabled = true;
  elements.profileError.textContent = '';
  try {
    await obterDb().collection('profiles').doc(authenticatedUser.uid).set({
      displayName,
      bio,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    currentProfile = { displayName, bio };
    elements.profileViewName.textContent = displayName;
    elements.profileViewBio.textContent = bio || 'Você ainda não adicionou uma biografia.';
    mostrarEditorDePerfil(false);
    renderizarInicio();
    mostrarAviso('Perfil atualizado.');
  } catch (error) {
    console.error('Não foi possível salvar o perfil:', error);
    elements.profileError.textContent = error?.code === 'permission-denied'
      ? 'O Firebase bloqueou a gravação do perfil. Atualize as regras do Firestore.'
      : 'Não foi possível salvar o perfil. Verifique sua conexão e tente novamente.';
  } finally {
    button.disabled = false;
  }
});

elements.copyProfileLinkButton.addEventListener('click', async () => {
  elements.profilePublicUrl.select();
  if (!navigator.clipboard?.writeText) {
    mostrarAviso('Link selecionado. Copie o endereço para compartilhar.');
    return;
  }
  try {
    await navigator.clipboard.writeText(elements.profilePublicUrl.value);
    mostrarAviso('Link do perfil copiado.');
  } catch (error) {
    console.error('Não foi possível copiar o link do perfil:', error);
    mostrarAviso('Não foi possível copiar automaticamente. Copie o endereço selecionado.');
  }
});

elements.boardsAddButton.addEventListener('click', () => abrirFormularioDeQuadro());
elements.profileEditButton.addEventListener('click', () => mostrarEditorDePerfil(true));
elements.profileCancelButton.addEventListener('click', () => {
  elements.profileDisplayName.value = currentProfile?.displayName || '';
  elements.profileBio.value = currentProfile?.bio || '';
  elements.profileError.textContent = '';
  mostrarEditorDePerfil(false);
});
elements.profileInviteForm.addEventListener('submit', (event) => void enviarConviteDoPerfil(event));

elements.board.addEventListener('click', (event) => {
  if (!podeEditarQuadro()) return;
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

  const columns = obterQuadroAtual().columns ?? COLUMNS;
  const columnIndex = columns.findIndex((column) => column.id === task.column);
  if (actionButton.dataset.action === 'previous') moverAtividade(task.id, columns[columnIndex - 1]?.id);
  if (actionButton.dataset.action === 'next') moverAtividade(task.id, columns[columnIndex + 1]?.id);
  if (actionButton.dataset.action === 'edit') abrirFormularioDeAtividade(task.column, task);
  if (actionButton.dataset.action === 'delete') {
    abrirConfirmacao({ title: 'Excluir atividade?', message: `A atividade “${task.title}” será removida permanentemente.`, action: 'task', id: task.id });
  }
});

elements.board.addEventListener('dragstart', (event) => {
  if (!podeEditarQuadro()) return;
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
  event.preventDefault();
  if (!podeEditarQuadro()) return;
  const formData = new FormData(elements.taskForm);
  const title = String(formData.get('title')).trim();
  if (!title) return;

  const board = obterQuadroAtual();
  const existingTask = board.tasks.find((task) => task.id === taskBeingEdited);
  const taskData = {
    title,
    description: String(formData.get('description')).trim(),
    priority: Object.hasOwn(PRIORITIES, formData.get('priority')) ? formData.get('priority') : 'medium',
    column: elements.taskForm.dataset.column,
    deadline: String(formData.get('deadline') || ''),
    assigneeId: String(formData.get('assignee') || ''),
    assigneeEmail: elements.taskForm.elements.assignee.selectedOptions[0]?.dataset.email || '',
    labels: String(formData.get('labels') || '').split(',').map((label) => label.trim()).filter(Boolean),
    storyPoints: Number(formData.get('storyPoints')) || 0,
    sprintId: String(formData.get('sprintId') || ''),
    acceptanceCriteria: String(formData.get('acceptanceCriteria') || '').trim(),
    definitionOfDone: String(formData.get('definitionOfDone') || '').trim(),
    checklist: String(formData.get('checklist') || '')
      .split('\n')
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => {
        const existing = existingTask?.checklist?.find((item) => item.text === text);
        return { id: existing?.id ?? criarId(), text, done: existing?.done === true };
      }),
  };
  const targetColumn = (board.columns ?? COLUMNS).find((column) => column.id === taskData.column);
  const existingCount = board.tasks.filter((task) => (
    task.column === taskData.column
    && (task.sprintId || '') === taskData.sprintId
    && task.id !== taskBeingEdited
  )).length;
  if (!existingTask && targetColumn?.limit > 0 && existingCount >= targetColumn.limit) {
    mostrarAviso(`A coluna “${targetColumn.name}” atingiu o limite de WIP (${targetColumn.limit}).`);
    return;
  }
  if (existingTask) Object.assign(existingTask, taskData);
  else board.tasks.push({ id: criarId(), ...taskData });

  elements.taskDialog.close();
  void salvarEstado(existingTask ? `Atualizou “${title}”` : `Criou “${title}”`);
  renderizar();
  if (activeTaskId) renderizarPaginaDaTask();
});

elements.boardForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = String(new FormData(elements.boardForm).get('name')).trim();
  if (!name) return;

  let activityMessage;
  let createdBoard = null;
  if (boardBeingEdited) {
    if (papelDoQuadro(obterQuadroAtual()) !== 'owner') return;
    obterQuadroAtual().name = name;
    activityMessage = `Renomeou o quadro para “${name}”`;
  }
  else {
    const board = criarQuadro(name);
    board.ownerId = authenticatedUser.uid;
    board.role = 'owner';
    state.boards.push(board);
    state.activeBoardId = board.id;
    createdBoard = board;
    activityMessage = `Criou o quadro “${name}”`;
  }
  elements.boardDialog.close();
  void salvarEstado(activityMessage);
  renderizar();
  if (createdBoard) {
    window.history.pushState(null, '', `/quadros/${encodeURIComponent(createdBoard.id)}`);
    void abrirRotaAutenticada();
  }
});

elements.confirmForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!pendingDelete) return;
  if (pendingDelete.action === 'task') {
    if (!podeEditarQuadro()) return;
    const board = obterQuadroAtual();
    const task = board.tasks.find((item) => item.id === pendingDelete.id);
    if (task) pendingDelete.message = `Excluiu “${task.title}”`;
    board.tasks = board.tasks.filter((task) => task.id !== pendingDelete.id);
  }
  if (pendingDelete.action === 'board' && state.boards.length > 1) {
    if (papelDoQuadro(obterQuadroAtual()) !== 'owner') return;
    const board = obterQuadroAtual();
    if (board.isShared) {
      try {
        await excluirQuadroCompartilhado(board);
      } catch (error) {
        console.error('Não foi possível excluir o quadro compartilhado:', error);
        mostrarAviso('Não foi possível excluir o quadro no Firebase.');
        return;
      }
    }
    state.boards = state.boards.filter((board) => board.id !== pendingDelete.id);
    state.activeBoardId = state.boards[0].id;
  }
  const activityMessage = pendingDelete.message || 'Excluiu o quadro';
  pendingDelete = null;
  elements.confirmDialog.close();
  void salvarEstado(activityMessage);
  renderizar();
});

elements.boardSelect.addEventListener('change', () => {
  state.activeBoardId = elements.boardSelect.value;
  salvarEstado();
  renderizar();
  window.history.pushState(null, '', `/quadros/${encodeURIComponent(state.activeBoardId)}`);
  void abrirRotaAutenticada();
});

elements.sprintFilter.addEventListener('change', () => {
  const board = obterQuadroAtual();
  board.activeSprintId = elements.sprintFilter.value;
  renderizar();
  void salvarEstado(board.activeSprintId
    ? `Abriu a sprint “${board.sprints.find((sprint) => sprint.id === board.activeSprintId)?.name || ''}”`
    : 'Abriu o backlog');
});
elements.createSprintButton.addEventListener('click', () => {
  if (!podeEditarQuadro()) return;
  elements.sprintForm.reset();
  elements.sprintDialog.showModal();
  elements.sprintForm.elements.name.focus();
});
elements.sprintForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!podeEditarQuadro()) return;
  const formData = new FormData(elements.sprintForm);
  const name = String(formData.get('name')).trim();
  const startDate = String(formData.get('startDate') || '');
  const endDate = String(formData.get('endDate') || '');
  if (!name || (startDate && endDate && endDate < startDate)) {
    mostrarAviso('Informe um nome e um período válido para a sprint.');
    return;
  }
  const board = obterQuadroAtual();
  const sprint = { id: criarId(), name, startDate, endDate };
  board.sprints = [...(board.sprints ?? []), sprint];
  board.activeSprintId = sprint.id;
  elements.sprintDialog.close();
  renderizar();
  void salvarEstado(`Criou a sprint “${name}”`);
});

document.querySelector('#add-board').addEventListener('click', () => abrirFormularioDeQuadro());
document.querySelector('#rename-board').addEventListener('click', () => abrirFormularioDeQuadro(true));
elements.shareButton.addEventListener('click', () => void abrirCompartilhamentoDoQuadro());
elements.shareForm.addEventListener('submit', (event) => void convidarParaQuadro(event));
elements.manageColumnsButton.addEventListener('click', abrirConfiguracaoColunas);
elements.addColumnButton.addEventListener('click', () => {
  const name = elements.newColumnName.value.trim();
  if (!name) {
    elements.newColumnName.focus();
    return;
  }
  if (editingColumns.some((column) => column.name.toLowerCase() === name.toLowerCase())) {
    mostrarAviso('Já existe uma coluna com esse nome.');
    return;
  }
  editingColumns.push({
    id: criarId(),
    name,
    className: 'custom',
    limit: Math.max(0, Math.min(100, Number(elements.newColumnLimit.value) || 0)),
  });
  elements.newColumnName.value = '';
  renderizarConfiguracaoColunas();
});
elements.columnsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!editingColumns.length) {
    mostrarAviso('O quadro precisa ter pelo menos uma coluna.');
    return;
  }
  const columns = editingColumns.map((column) => {
    const nameInput = elements.columnSettingsList.querySelector(`[data-name-for="${CSS.escape(column.id)}"]`);
    const limitInput = elements.columnSettingsList.querySelector(`[data-limit-for="${CSS.escape(column.id)}"]`);
    return {
      ...column,
      name: nameInput.value.trim(),
      limit: Math.max(0, Math.min(100, Number(limitInput.value) || 0)),
    };
  });
  if (columns.some((column) => !column.name)
    || new Set(columns.map((column) => column.name.toLowerCase())).size !== columns.length) {
    mostrarAviso('Dê nomes diferentes e não vazios para as colunas.');
    return;
  }
  const board = obterQuadroAtual();
  board.columns = columns;
  elements.columnsDialog.close();
  void salvarEstado('Atualizou as colunas do Kanban');
  renderizar();
});
document.querySelector('#delete-board').addEventListener('click', () => {
  if (papelDoQuadro(obterQuadroAtual()) !== 'owner') {
    mostrarAviso('Somente o dono pode excluir este quadro.');
    return;
  }
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

window.addEventListener('popstate', () => {
  if (authenticatedUser && state) void abrirRotaAutenticada();
});

elements.taskPageEdit.addEventListener('click', () => {
  const found = localizarTask(activeTaskId, activeTaskBoardId);
  if (found) abrirFormularioDeAtividade(found.task.column, found.task);
});
elements.commentForm.addEventListener('submit', (event) => void adicionarComentario(event));

inicializarAutenticacao();
