import { createContext } from 'react';

export const ConnectivityContext = createContext(null);

// navigator.onLine only says whether a network interface exists. This makes a real request that
// bypasses every cache, so "online" really means "the server can be reached".
export async function checkConnection(timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}manifest.json?ping=${Date.now()}`,
      { cache: 'no-store', signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
