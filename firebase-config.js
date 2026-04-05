/**
 * Shared Firebase web config (public keys only). Fill from Firebase Console → Project settings.
 * Also set STN_FCM_VAPID_KEY from Project settings → Cloud Messaging → Web Push certificates.
 * Loaded in both the main page and firebase-messaging-sw.js (self/window).
 */
(function (g) {
  g.STN_FIREBASE_CONFIG = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  };
  g.STN_FCM_VAPID_KEY = '';
})(typeof self !== 'undefined' ? self : window);
