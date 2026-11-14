const FIREBASE_PROJECT_ID = 'quadro-kanban-fluxo';
const FIREBASE_API_KEY_PROPERTY = 'FIREBASE_WEB_API_KEY';
const FIREBASE_REST_ROOT = 'https://firestore.googleapis.com/v1/projects/'
  + FIREBASE_PROJECT_ID + '/databases/(default)/documents/';
const SITE_URL = 'https://quadro-kanban-fluxo.web.app/';

function authorizeScript() {
  MailApp.getRemainingDailyQuota();
  UrlFetchApp.fetch('https://www.google.com/generate_204');
}

function doPost(event) {
  let request;
  try {
    request = JSON.parse(event.postData.contents);
  } catch (error) {
    return jsonResponse_({ ok: false, code: 'invalid_request' });
  }

  const idToken = request && request.idToken;
  const boardId = request && request.boardId;
  const inviteId = request && request.inviteId;
  const requestId = request && request.requestId;
  if (typeof idToken !== 'string'
      || typeof boardId !== 'string'
      || !/^[A-Za-z0-9_-]{1,128}$/.test(boardId)
      || typeof inviteId !== 'string'
      || !/^[A-Za-z0-9_-]{1,128}$/.test(inviteId)
      || typeof requestId !== 'string'
      || !/^[A-Za-z0-9_-]{1,128}$/.test(requestId)) {
    return jsonResponse_({ ok: false, code: 'invalid_request' });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return jsonResponse_({ ok: false, code: 'busy' });
  }

  try {
    const identity = verifyIdToken_(idToken);
    const uid = identity.localId;
    const invite = getDocument_(
      'kanbans/' + boardId + '/invites/' + inviteId,
      idToken,
    );
    if (!invite) return jsonResponse_({ ok: false, code: 'invite_not_found' });

    const inviteFields = invite.fields || {};
    if (fieldString_(inviteFields, 'ownerId') !== uid
        || fieldString_(inviteFields, 'boardId') !== boardId) {
      return jsonResponse_({ ok: false, code: 'not_invite_owner' });
    }

    const board = getDocument_('kanbans/' + boardId, idToken);
    if (!board || fieldString_(board.fields || {}, 'ownerId') !== uid) {
      return jsonResponse_({ ok: false, code: 'not_board_owner' });
    }

    const invitedEmail = fieldString_(inviteFields, 'invitedEmail').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)) {
      return jsonResponse_({ ok: false, code: 'invalid_invited_email' });
    }

    const statusPath = 'users/' + encodeURIComponent(uid) + '/kanban/inviteEmail_' + inviteId;
    const statusDocument = getDocument_(statusPath, idToken);
    const currentStatus = statusDocument
      ? fieldString_(statusDocument.fields || {}, 'status')
      : '';
    const force = request.force === true;

    if (currentStatus === 'sent' && !force) {
      writeStatus_(statusPath, idToken, 'sent', '', requestId);
      return jsonResponse_({ ok: true, status: 'sent' });
    }
    if (currentStatus === 'sending' && !isStale_(statusDocument)) {
      return jsonResponse_({ ok: true, status: 'sending' });
    }

    writeStatus_(statusPath, idToken, 'sending', '', requestId);
    try {
      const boardName = fieldString_(board.fields || {}, 'name')
        .replace(/[\r\n]/g, ' ')
        .slice(0, 100) || 'um quadro';
      sendInviteEmail_(invitedEmail, boardName);
    } catch (error) {
      console.error('Falha ao enviar convite: ' + error.message);
      writeStatus_(
        statusPath,
        idToken,
        'failed',
        'Não foi possível enviar. Confira a cota do Gmail e a implantação do Apps Script.',
        requestId,
      );
      return jsonResponse_({ ok: false, code: 'email_send_failed' });
    }
    writeStatus_(statusPath, idToken, 'sent', '', requestId);
    return jsonResponse_({ ok: true, status: 'sent' });
  } catch (error) {
    console.error('Falha ao processar convite: ' + error.message);
    return jsonResponse_({ ok: false, code: 'request_failed' });
  } finally {
    lock.releaseLock();
  }
}

function verifyIdToken_(idToken) {
  const apiKey = PropertiesService.getScriptProperties()
    .getProperty(FIREBASE_API_KEY_PROPERTY);
  if (!apiKey) throw new Error('Firebase API key não configurada nas Script Properties.');

  const response = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='
      + encodeURIComponent(apiKey),
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true,
    },
  );
  if (response.getResponseCode() !== 200) {
    throw new Error('O Firebase não validou o token de autenticação.');
  }

  const result = JSON.parse(response.getContentText());
  const user = result.users && result.users[0];
  if (!user || user.disabled) throw new Error('Conta Firebase inválida ou desativada.');
  return user;
}

function getDocument_(path, idToken) {
  const response = UrlFetchApp.fetch(FIREBASE_REST_ROOT + path, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + idToken },
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code === 404) return null;
  if (code !== 200) throw new Error('Falha ao consultar o Firestore (HTTP ' + code + ').');
  return JSON.parse(response.getContentText());
}

function writeStatus_(path, idToken, status, message, requestId) {
  const response = UrlFetchApp.fetch(FIREBASE_REST_ROOT + path, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + idToken },
    payload: JSON.stringify({
      fields: {
        status: { stringValue: status },
        message: { stringValue: message },
        updatedAt: { integerValue: String(Date.now()) },
        requestId: { stringValue: requestId },
      },
    }),
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('Falha ao salvar o estado do e-mail no Firestore (HTTP ' + code + ').');
  }
}

function sendInviteEmail_(recipient, boardName) {
  const subject = 'Convite para colaborar em ' + boardName;
  const body = 'Você recebeu um convite para colaborar no quadro "' + boardName
    + '" no Fluxo.\n\nEntre no site com este endereço de e-mail e aceite o convite: '
    + SITE_URL;
  const htmlBody = '<p>Você recebeu um convite para colaborar no quadro <strong>'
    + escapeHtml_(boardName)
    + '</strong> no Fluxo.</p><p>Entre no site com este endereço de e-mail e aceite o convite:</p>'
    + '<p><a href="' + SITE_URL + '">Abrir o Fluxo</a></p>';
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: body,
    htmlBody: htmlBody,
    name: 'Fluxo',
  });
}

function isStale_(document) {
  const timestamp = document.fields
    && document.fields.updatedAt
    && Number(document.fields.updatedAt.integerValue);
  return !timestamp || Date.now() - timestamp > 5 * 60 * 1000;
}

function fieldString_(fields, name) {
  const field = fields[name];
  return field && typeof field.stringValue === 'string' ? field.stringValue : '';
}

function escapeHtml_(value) {
  return value.replace(/[&<>"']/g, function (character) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character];
  });
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
