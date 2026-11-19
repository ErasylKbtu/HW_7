import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import Icon from '../components/Icon.jsx';
import useConnectivity from '../hooks/useConnectivity.js';

// The in-app /offline page (#/offline). The static public/offline.html is the fallback when the shell itself cannot load.
export default function Offline() {
  const { recheck } = useConnectivity();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState('idle');
  const back = location.state?.from || '/assignments';

  async function retry() {
    setState('checking');
    const ok = await recheck();
    if (ok) navigate(back, { replace: true });
    else setState('failed');
  }

  return <section className="offline-page panel">
    <span className="offline-icon"><Icon name="wifi-off" size={34} /></span>
    <p className="eyebrow">NO CONNECTION</p>
    <h1>You are offline<span>.</span></h1>
    <p className="offline-text">This page needs the internet and has not been saved on this device yet. Your assignments and every page you have already opened are still available.</p>
    <p className={`offline-status ${state}`} role="status" aria-live="polite">
      {state === 'checking' ? 'Checking connection…' : state === 'failed' ? 'Still offline. Check your Wi-Fi or mobile data and try again.' : ''}
    </p>
    <div className="hero-actions">
      <button className="button primary" onClick={retry} disabled={state === 'checking'}><Icon name="reload" size={17} />Retry connection</button>
      <Link className="button secondary" to="/assignments">Open my assignments</Link>
    </div>
  </section>;
}
