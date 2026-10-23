import { getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabaseClient';
import { getMessagingIfSupported, VAPID_KEY } from './firebase';

export async function requestPushPermission() {
  if (!('Notification' in window)) return { ok: false, reason: 'unsupported' };

  if (Notification.permission === 'denied') {
    return { ok: false, reason: 'denied' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return { ok: false, reason: 'denied' };
  }

  return { ok: true };
}

export async function registerPushToken(userId) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return { ok: false, reason: 'messaging_unsupported' };

  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js'
  );
  await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) return { ok: false, reason: 'no_token' };

  const payload = {
    user_id: userId,
    endpoint: token,
    p256dh: token.slice(0, 100),
    auth: token.slice(-100),
    user_agent: navigator.userAgent.slice(0, 200),
  };

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(payload, { onConflict: 'endpoint' });

  if (error) {
    console.error("Push Registration Error:", error);
    return { ok: false, reason: 'db_error', error };
  }

  await supabase.from('profiles').update({ push_enabled: true }).eq('id', userId);

  return { ok: true, token };
}

export function listenForeground(onReceive) {
  getMessagingIfSupported().then((messaging) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      onReceive(payload);
    });
  });
}