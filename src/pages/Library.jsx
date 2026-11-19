import { Link, Navigate, useLocation, useSearchParams } from 'react-router';
import { getLibraryList } from '../services/publicApi.js';
import useApi from '../hooks/useApi.js';
import useConnectivity from '../hooks/useConnectivity.js';
import Icon from '../components/Icon.jsx';
import { ErrorView, Loading } from '../components/StateViews.jsx';
import CachedNotice from '../pwa/CachedNotice.jsx';

export default function Library() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { online, reconnects } = useConnectivity();
  const filters = Object.fromEntries(params);
  // reconnects reloads the list automatically when the connection returns.
  const result = useApi(getLibraryList, JSON.stringify(filters), reconnects);

  function change(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value); else next.delete(name);
    if (name !== 'page') next.delete('page');
    setParams(next, { replace: name === 'q' });
  }

  // Not saved yet and no connection: the navigation cannot complete, so show the offline page.
  if (result.status === 'error' && result.error.code === 'NETWORK' && !online) {
    return <Navigate to="/offline" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>
    <section className="page-heading"><div><p className="eyebrow">PUBLIC STUDY LIBRARY</p><h1>Library<span>.</span></h1><p>Study notes from a public API. Notes you open stay available offline.</p></div></section>
    <section className="panel filters-panel" aria-label="Library search">
      <label className="search-field"><Icon name="search" size={18} /><input aria-label="Search notes" placeholder="Search notes…" value={filters.q || ''} onChange={(event) => change('q', event.target.value)} /></label>
    </section>
    {result.status === 'loading' ? <Loading text="Loading the library…" /> : result.status === 'error' ? <ErrorView title="Couldn't load the library" message={result.error.message} onRetry={result.retry} /> : <>
      {result.data.cached && <CachedNotice cachedAt={result.data.cachedAt} onRefresh={result.retry} />}
      <div className="results-heading"><p><strong>{result.data.total}</strong> notes found</p><span>Page {result.data.page} of {result.data.pages}</span></div>
      {result.data.items.length ? <div className="cards-grid">{result.data.items.map((note) => <article className="assignment-card library-card" key={note.id}>
        <div className="card-top"><span className="task-symbol"><Icon name="book" size={23} /></span><span className="badge">Note {note.id}</span></div>
        <p className="task-course">Author {note.userId}</p>
        <h2><Link to={`/library/${note.id}`} state={{ from: `/library${location.search}` }}>{note.title}</Link></h2>
        <p className="library-excerpt">{note.body.replaceAll('\n', ' ').slice(0, 90)}…</p>
        <div className="card-last"><span>Read note</span><Link aria-label={`Open ${note.title}`} to={`/library/${note.id}`} state={{ from: `/library${location.search}` }}><Icon name="arrow" size={19} /></Link></div>
      </article>)}</div> : <div className="state-view panel"><span className="state-icon"><Icon name="search" size={28} /></span><h3>No notes found</h3><p>Try a different search.</p><button className="button secondary" onClick={() => setParams({})}>Clear search</button></div>}
      <nav className="pagination" aria-label="Library pages"><button className="button secondary" disabled={result.data.page === 1} onClick={() => change('page', String(result.data.page - 1))}>Previous</button><span>{result.data.page} / {result.data.pages}</span><button className="button secondary" disabled={result.data.page === result.data.pages} onClick={() => change('page', String(result.data.page + 1))}>Next</button></nav>
    </>}
  </>;
}
