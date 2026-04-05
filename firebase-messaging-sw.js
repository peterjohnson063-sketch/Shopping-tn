/* eslint-disable no-undef */
importScripts('firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

var cfg = self.STN_FIREBASE_CONFIG;
if (cfg && cfg.apiKey && cfg.messagingSenderId) {
  firebase.initializeApp(cfg);
  var messaging = firebase.messaging();
  messaging.onBackgroundMessage(function (payload) {
    var n = payload.notification || {};
    var title = n.title || 'Everest';
    var body = n.body || '';
    var data = payload.data || {};
    var url = data.url || data.click_action || '/';
    return self.registration.showNotification(title, {
      body: body,
      icon: '/assets/everest-logo.png',
      badge: '/assets/everest-logo.png',
      tag: data.tag || 'everest-push',
      data: { url: url, tracking: data.tracking || '' },
    });
  });
  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    var url = (event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(clients.openWindow(url));
  });
}
