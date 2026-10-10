import { createContext, useContext, useEffect, useState } from 'react';
import {
  requestPushPermission,
  registerPushToken,
  listenForeground,
} from '../lib/push';
import { useAuth } from './AuthContext';

const PushContext = createContext();

export function PushProvider({ children }) {
  const { user, profile } = useAuth();
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [registering, setRegistering] = useState(false);
  const [lastPush, setLastPush] = useState(null);

  const enable = async () => {
    if (!user) return { ok: false, reason: 'no_user' };
    setRegistering(true);

    const perm = await requestPushPermission();
    if (!perm.ok) {
      setRegistering(false);
      setPermission(Notification.permission);
      return perm;
    }

    setPermission('granted');
    const result = await registerPushToken(user.id);
    setRegistering(false);
    return result;
  };

  useEffect(() => {
    if (user && profile?.push_enabled && Notification.permission === 'granted') {
      registerPushToken(user.id).catch(() => {});
    }
  }, [user, profile?.push_enabled]);

  useEffect(() => {
    listenForeground((payload) => {
      setLastPush(payload);
      const title = payload.notification?.title || payload.data?.title || 'Heghizbah';
      const body = payload.notification?.body || payload.data?.body || '';
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icons/192.png',
          badge: '/icons/192.png',
        });
      }
    });
  }, []);

  return (
    <PushContext.Provider
      value={{
        permission,
        registering,
        lastPush,
        enablePush: enable,
      }}
    >
      {children}
    </PushContext.Provider>
  );
}

export function usePush() {
  const ctx = useContext(PushContext);
  if (!ctx) throw new Error('usePush must be used inside PushProvider');
  return ctx;
}