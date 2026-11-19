import { useContext } from 'react';
import { ConnectivityContext } from '../pwa/connectivity.js';

export default function useConnectivity() {
  const context = useContext(ConnectivityContext);
  if (!context) throw new Error('useConnectivity must be used inside ConnectivityProvider.');
  return context;
}
