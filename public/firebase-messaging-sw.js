importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyCdauO_1_sENTGyha5JaazkD6nGwsN5pqc',
  authDomain: 'rccg-heghizbah.firebaseapp.com',
  projectId: 'rccg-heghizbah',
  storageBucket: 'rccg-heghizbah.firebasestorage.app',
  messagingSenderId: '764798521259',
  appId: '1:764798521259:web:50c5ef4d27322d44414cee',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Heghizbah';
  const body = payload.notification?.body || payload.data?.body || '';
  const icon = '/icons/192.png';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/icons/192.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: payload.data?.tag || 'heghizbah',
    renotify: true,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});