import { useEffect, useRef, useState } from 'react';
import { checkConnection, ConnectivityContext } from './connectivity.js';

export default function ConnectivityProvider({ children }) {
  const [online, setOnline] = useState(() => navigator.onLine);
  // reconnects increases every time the connection comes back, so pages can reload their data.
  const [reconnects, setReconnects] = useState(0);
  const current = useRef(online);

  function apply(next) {
    if (next === current.current) return;
    current.current = next;
    setOnline(next);
    if (next) setReconnects((count) => count + 1);
  }

  async function recheck() {
    const ok = await checkConnection();
    apply(ok);
    return ok;
  }

  useEffect(() => {
    const goOffline = () => apply(false);
    const goOnline = () => { checkConnection().then(apply); };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return <ConnectivityContext.Provider value={{ online, reconnects, recheck }}>{children}</ConnectivityContext.Provider>;
}
