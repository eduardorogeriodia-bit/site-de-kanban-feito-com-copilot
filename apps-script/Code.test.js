const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');

function response(code, body) {
  return {
    getResponseCode: () => code,
    getContentText: () => JSON.stringify(body),
  };
}

function createHarness(options = {}) {
  const documents = new Map([
    ['kanbans/board-1', {
      fields: {
        ownerId: { stringValue: 'owner-1' },
        name: { stringValue: 'Projeto <um>' },
      },
    }],
    ['kanbans/board-1/invites/invite-1', {
      fields: {
        ownerId: { stringValue: 'owner-1' },
        boardId: { stringValue: 'board-1' },
        invitedEmail: { stringValue: 'guest@example.com' },
      },
    }],
  ]);
  const sentEmails = [];
  const firestoreRoot = 'https://firestore.googleapis.com/v1/projects/'
    + 'quadro-kanban-fluxo/databases/(default)/documents/';
  const context = {
    console: { error() {} },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => 'test-api-key' }),
    },
    UrlFetchApp: {
      fetch(url, request = {}) {
        if (url.indexOf('identitytoolkit.googleapis.com') >= 0) {
          return response(200, {
            users: [{ localId: options.uid || 'owner-1', disabled: false }],
          });
        }

        const documentPath = url.slice(firestoreRoot.length);
        if (request.method === 'get') {
          return documents.has(documentPath)
            ? response(200, documents.get(documentPath))
            : response(404, {});
        }
        if (request.method === 'patch') {
          documents.set(documentPath, JSON.parse(request.payload));
          return response(200, {});
        }
        throw new Error('Unexpected request: ' + request.method);
      },
    },
    MailApp: {
      sendEmail(email) {
        if (options.failEmail) throw new Error('mail quota exceeded');
        sentEmails.push(email);
      },
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(content) {
        return {
          content,
          setMimeType() { return this; },
        };
      },
    },
  };
  vm.runInNewContext(source, context);

  return {
    documents,
    sentEmails,
    send(request) {
      const output = context.doPost({
        postData: { contents: JSON.stringify(request) },
      });
      return JSON.parse(output.content);
    },
  };
}

function inviteRequest(overrides = {}) {
  return {
    idToken: 'valid-token',
    boardId: 'board-1',
    inviteId: 'invite-1',
    requestId: 'request-1',
    ...overrides,
  };
}

test('only the authenticated invite owner can trigger an email', () => {
  const harness = createHarness({ uid: 'attacker-1' });

  const result = harness.send(inviteRequest());

  assert.equal(result.code, 'not_invite_owner');
  assert.equal(harness.sentEmails.length, 0);
  assert.equal(harness.documents.has('users/attacker-1/kanban/inviteEmail_invite-1'), false);
});

test('sends to the stored invite address and records the matching request status', () => {
  const harness = createHarness();

  const result = harness.send(inviteRequest());

  assert.deepEqual(result, { ok: true, status: 'sent' });
  assert.equal(harness.sentEmails.length, 1);
  assert.equal(harness.sentEmails[0].to, 'guest@example.com');
  assert.match(harness.sentEmails[0].htmlBody, /Projeto &lt;um&gt;/);
  const status = harness.documents.get('users/owner-1/kanban/inviteEmail_invite-1').fields;
  assert.equal(status.status.stringValue, 'sent');
  assert.equal(status.requestId.stringValue, 'request-1');
  assert.equal(harness.documents.has('kanbans/board-1/members/guest-1'), false);
});

test('records a failed email attempt without granting board membership', () => {
  const harness = createHarness({ failEmail: true });

  const result = harness.send(inviteRequest());

  assert.equal(result.code, 'email_send_failed');
  assert.equal(harness.documents.get('users/owner-1/kanban/inviteEmail_invite-1').fields.status.stringValue, 'failed');
  assert.equal(harness.documents.has('kanbans/board-1/members/guest-1'), false);
});
