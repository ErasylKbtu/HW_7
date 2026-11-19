import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));

test('manifest has every field the PWA assignment requires', () => {
  for (const key of ['name', 'short_name', 'start_url', 'scope', 'theme_color', 'background_color']) {
    assert.ok(manifest[key], `${key} is missing`);
  }
  assert.equal(manifest.display, 'standalone');
});

test('manifest has 192x192 and 512x512 icons that exist on disk', () => {
  const sizes = manifest.icons.map((icon) => icon.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  for (const icon of manifest.icons) assert.ok(existsSync(`public/${icon.src}`), `${icon.src} is missing`);
});

test('index.html links the manifest and the offline page exists', () => {
  assert.match(readFileSync('index.html', 'utf8'), /rel="manifest"/);
  assert.ok(existsSync('public/offline.html'));
  assert.match(readFileSync('public/offline.html', 'utf8'), /Retry connection/);
});
