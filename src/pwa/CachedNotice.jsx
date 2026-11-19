import Icon from '../components/Icon.jsx';
import useConnectivity from '../hooks/useConnectivity.js';

// Shown above public API data that came from the service-worker cache instead of the network.
export default function CachedNotice({ cachedAt, onRefresh }) {
  const { online } = useConnectivity();
  const when = cachedAt ? new Date(cachedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'an earlier visit';
  return <div className="notice info cached-notice" role="status">
    <Icon name="wifi-off" size={18} />
    <span><strong>Viewing saved data.</strong> Last updated {when}.{online ? '' : ' Reconnect to refresh it.'}</span>
    {online && onRefresh && <button className="button secondary" onClick={onRefresh}>Refresh</button>}
  </div>;
}
