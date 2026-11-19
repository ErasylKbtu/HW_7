// Public REST API (list + details). Requests go through the service worker, which keeps the
// last successful responses (network-first) so they stay readable offline.
// Replace PUBLIC_API and the two paths below to use a different public API.
export const PUBLIC_API = 'https://jsonplaceholder.typicode.com';
export const LIBRARY_PAGE_SIZE = 9;

function failure(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function getJson(path, { signal } = {}) {
  let response;
  try {
    response = await fetch(`${PUBLIC_API}${path}`, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw failure('The library cannot be reached right now, and this page has not been saved on this device yet.', 'NETWORK');
  }
  if (response.status === 404) throw failure('This note does not exist.', 'NOT_FOUND');
  if (!response.ok) throw failure(`The library responded with an error (${response.status}). Please try again.`, 'HTTP');
  let data;
  try { data = await response.json(); }
  catch { throw failure('The library sent an unreadable response. Please try again.', 'HTTP'); }
  // x-sw-cache is added by the service worker when the answer comes from the cache.
  return { data, cached: response.headers.get('x-sw-cache') === 'hit', cachedAt: response.headers.get('x-sw-cached-at') };
}

const tidy = (note) => ({ ...note, title: note.title.charAt(0).toUpperCase() + note.title.slice(1) });

export async function getLibraryList(filters = {}, options = {}) {
  const { data, cached, cachedAt } = await getJson('/posts', options);
  const query = String(filters.q ?? '').trim().toLowerCase();
  const matches = data.map(tidy).filter((note) => !query || `${note.title} ${note.body}`.toLowerCase().includes(query));
  const pages = Math.max(1, Math.ceil(matches.length / LIBRARY_PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(filters.page) || 1)));
  return { items: matches.slice((page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE), total: matches.length, pages, page, cached, cachedAt };
}

export async function getLibraryItem(id, options = {}) {
  try {
    const { data, cached, cachedAt } = await getJson(`/posts/${id}`, options);
    return { note: tidy(data), cached, cachedAt };
  } catch (error) {
    if (error.code !== 'NETWORK') throw error;
    // Offline and this note was never opened: it may still be inside the saved list.
    try {
      const list = await getJson('/posts', options);
      const found = list.data.find((note) => String(note.id) === String(id));
      if (found) return { note: tidy(found), cached: list.cached, cachedAt: list.cachedAt };
    } catch (inner) { if (inner.name === 'AbortError') throw inner; }
    throw error;
  }
}
