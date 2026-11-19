import { Link, Navigate, useLocation, useParams } from 'react-router';
import { getLibraryItem } from '../services/publicApi.js';
import useApi from '../hooks/useApi.js';
import useConnectivity from '../hooks/useConnectivity.js';
import { ErrorView, Loading } from '../components/StateViews.jsx';
import Icon from '../components/Icon.jsx';
import CachedNotice from '../pwa/CachedNotice.jsx';
import NotFound from './NotFound.jsx';

export default function LibraryDetails() {
  const { id } = useParams();
  const location = useLocation();
  const { online, reconnects } = useConnectivity();
  const back = location.state?.from || '/library';
  const valid = /^\d{1,4}$/.test(id);
  const result = useApi(getLibraryItem, JSON.stringify(valid ? id : '0'), reconnects);

  if (!valid || result.error?.code === 'NOT_FOUND') return <NotFound item />;
  if (result.status === 'error' && result.error.code === 'NETWORK' && !online) {
    return <Navigate to="/offline" replace state={{ from: location.pathname }} />;
  }
  return <>
    <div className="detail-navigation"><Link to={back}>← Back</Link><Link to="/library">Library ↗</Link></div>
    <section className="panel detail-page">
      {result.status === 'loading' ? <Loading text="Loading note…" /> : result.status === 'error'
        ? <ErrorView title="Couldn't load this note" message={result.error.message} onRetry={result.retry} />
        : <article className="details-content" data-testid="note-details">
          {result.data.cached && <CachedNotice cachedAt={result.data.cachedAt} onRefresh={result.retry} />}
          <div className="details-top"><span className="eyebrow">STUDY NOTE</span><span className="badge">Note {result.data.note.id}</span></div>
          <div className="detail-emblem"><Icon name="book" size={32} /></div>
          <p className="detail-course">Author {result.data.note.userId}</p>
          <h2>{result.data.note.title}</h2>
          <p className="description library-body">{result.data.note.body}</p>
        </article>}
    </section>
  </>;
}
