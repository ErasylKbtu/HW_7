import test from 'node:test';
import assert from 'node:assert/strict';
import { getLibraryItem, getLibraryList, LIBRARY_PAGE_SIZE } from '../src/services/publicApi.js';

const notes = Array.from({ length: 25 }, (_, i) => ({ userId: 1, id: i + 1, title: `note ${i + 1} about react`, body: `body ${i + 1}` }));
const json = (data, init = {}) => new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' }, ...init });

function mockFetch(handler) {
  globalThis.fetch = async (url, options) => handler(String(url), options);
}

test('list is paginated, searchable and reports a network answer as not cached', async () => {
  mockFetch(() => json(notes));
  const first = await getLibraryList({});
  assert.equal(first.items.length, LIBRARY_PAGE_SIZE);
  assert.equal(first.total, 25);
  assert.equal(first.pages, 3);
  assert.equal(first.cached, false);
  assert.equal(first.items[0].title, 'Note 1 about react');
  const search = await getLibraryList({ q: 'body 7', page: '99' });
  assert.equal(search.total, 1);
  assert.equal(search.page, 1);
});

test('answers marked by the service worker are reported as cached', async () => {
  mockFetch(() => json(notes, { headers: { 'x-sw-cache': 'hit', 'x-sw-cached-at': '2026-11-19T10:00:00.000Z' } }));
  const result = await getLibraryList({});
  assert.equal(result.cached, true);
  assert.equal(result.cachedAt, '2026-11-19T10:00:00.000Z');
});

test('network failures become a NETWORK error and 404 becomes NOT_FOUND', async () => {
  mockFetch(() => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(getLibraryList({}), { code: 'NETWORK' });
  mockFetch(() => new Response('{}', { status: 404 }));
  await assert.rejects(getLibraryItem('9999'), { code: 'NOT_FOUND' });
  mockFetch(() => new Response('oops', { status: 500 }));
  await assert.rejects(getLibraryList({}), { code: 'HTTP' });
});

test('an unopened note is recovered from the saved list when offline', async () => {
  mockFetch((url) => {
    if (url.endsWith('/posts/3')) throw new TypeError('Failed to fetch');
    return json(notes, { headers: { 'x-sw-cache': 'hit' } });
  });
  const result = await getLibraryItem('3');
  assert.equal(result.note.id, 3);
  assert.equal(result.cached, true);
  mockFetch(() => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(getLibraryItem('3'), { code: 'NETWORK' });
});

test('aborted requests are not turned into network errors', async () => {
  mockFetch(() => { throw new DOMException('Request cancelled', 'AbortError'); });
  await assert.rejects(getLibraryList({}), { name: 'AbortError' });
});
