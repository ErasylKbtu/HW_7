import useConnectivity from '../hooks/useConnectivity.js';

export default function ConnectionBadge() {
  const { online } = useConnectivity();
  return <span className={`connection-badge ${online ? 'is-online' : 'is-offline'}`} role="status" aria-live="polite">
    <span className="connection-dot" aria-hidden="true" />{online ? 'Online' : 'Offline'}
  </span>;
}
