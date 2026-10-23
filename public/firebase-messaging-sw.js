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
  const title = payload.notification?.title || payload.data?.title || 'RCCG Heghizbah';
  const body = payload.notification?.body || payload.data?.body || 'New announcement';
  
  const options = {
    body: body,
    // iOS uses this as the main app icon, Android uses it as the large icon on the right
    icon: '/icons/192.png', 
    
    // Android Only: Large banner image
    image: payload.data?.image || '/icons/512.png', 
    
    // Android Only: Vibration pattern
    vibrate: [200, 100, 200],
    
    // Both platforms: Groups notifications so they don't stack infinitely
    tag: 'heghizbah-notification', 
    renotify: true, 
    
    // Android Only: Action Buttons
    actions: [
      {
        action: 'open',
        title: 'Read Now'
      }
    ],
    
    data: {
      url: payload.data?.url || '/announcements',
    }
  };

  self.registration.showNotification(title, options);
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

self.addEventListener('fetch', (event) => {});