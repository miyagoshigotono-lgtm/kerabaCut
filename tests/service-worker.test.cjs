const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('ケラバ自身の旧キャッシュだけを削除し、統合アプリなどは残す', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../app/sw.js'), 'utf8');
  const current = source.match(/const VERSION = '([^']+)'/)[1];
  const keys = [current, 'keraba-v-old', 'wood-calculators:/bolt-effective-length/:20261030-1', 'another-app'];
  const deleted = [];
  let activate;
  vm.runInNewContext(source, {
    self: { addEventListener(name, handler) { if (name === 'activate') activate = handler; }, clients: { claim: async () => {} } },
    caches: { keys: async () => keys, delete: async (key) => deleted.push(key) },
  });
  let done;
  activate({ waitUntil(promise) { done = promise; } });
  await done;
  assert.deepEqual(deleted, ['keraba-v-old']);
});
