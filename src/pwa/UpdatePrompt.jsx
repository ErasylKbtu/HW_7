import { useRegisterSW } from 'virtual:pwa-register/react';
import Icon from '../components/Icon.jsx';

const HOUR = 60 * 60 * 1000;

// Registers the service worker and tells the user when a new version is waiting.
export default function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], offlineReady: [offlineReady, setOfflineReady], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Look for a new version every hour and whenever the app returns to the foreground.
      setInterval(() => { if (navigator.onLine) registration.update().catch(() => {}); }, HOUR);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) registration.update().catch(() => {});
      });
    },
    onRegisterError(error) { console.warn('Service worker registration failed', error); },
  });

  if (!needRefresh && !offlineReady) return null;
  return <div className="update-toast" role={needRefresh ? 'alertdialog' : 'status'} aria-live="polite" aria-label={needRefresh ? 'Update available' : 'Offline ready'}>
    <Icon name={needRefresh ? 'reload' : 'check'} size={20} />
    <p>{needRefresh ? 'A new version of StudyFlow is available.' : 'StudyFlow is ready to work offline.'}</p>
    <div className="update-actions">
      {needRefresh && <button className="button primary" onClick={() => updateServiceWorker(true)}>Update now</button>}
      <button className="button secondary" onClick={() => { setNeedRefresh(false); setOfflineReady(false); }}>{needRefresh ? 'Later' : 'Got it'}</button>
    </div>
  </div>;
}
