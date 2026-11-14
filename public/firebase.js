(function () {
  if (!window.firebaseConfig) {
    console.warn('Configuração do Firebase não encontrada. Edite o arquivo firebase-config.js.');
    return;
  }

  if (!window.firebase) {
    console.warn('Firebase SDK não carregado. Verifique os scripts do CDN no arquivo index.html.');
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
  }

  window.firebaseApp = firebase.apps[0];
  window.firebaseAuth = firebase.auth();
  window.firebaseDb = firebase.firestore();
})();
