const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../app/migrate.js'), 'utf8');

async function run({ protocol = 'https:', hostname = 'miyagoshigotono-lgtm.github.io', online = true, ok = true, fail = false } = {}) {
  let redirected = null, requested = null;
  vm.runInNewContext(source, {
    location: { protocol, hostname, replace: (url) => { redirected = url; } },
    navigator: { onLine: online }, AbortController, setTimeout, clearTimeout,
    fetch: async (url, options) => { requested = { url, options }; if (fail) throw new Error('接続不可'); return { ok }; },
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { redirected, requested };
}

test('旧公開URLは接続を確認してケラバを指定し、入力や認証情報を送らず移動する', async () => {
  const result = await run();
  assert.equal(result.redirected, 'https://miyagoshigotono-lgtm.github.io/bolt-effective-length/#keraba');
  assert.equal(result.requested.url, 'https://miyagoshigotono-lgtm.github.io/bolt-effective-length/');
  assert.equal(result.requested.options.method, 'HEAD');
  assert.equal(result.requested.options.body, undefined);
});

test('オフライン・ローカル起動・社内配信・移行先の失敗では旧版を使い続ける', async () => {
  for (const options of [{ online: false }, { protocol: 'file:' }, { hostname: 'localhost' }, { ok: false }, { fail: true }]) {
    const result = await run(options);
    assert.equal(result.redirected, null);
    if (options.online === false || options.protocol || options.hostname) assert.equal(result.requested, null);
  }
});
