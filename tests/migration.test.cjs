const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../app/migrate.js'), 'utf8');

async function run({ protocol = 'https:', hostname = 'miyagoshigotono-lgtm.github.io', online = true, ok = true, fail = false } = {}) {
  let redirected = null, requested = null, hiddenDuringFetch = false, hiddenAtRedirect = false;
  const classes = new Set();
  vm.runInNewContext(source, {
    document: { documentElement: { classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) } } },
    location: { protocol, hostname, replace: (url) => { redirected = url; hiddenAtRedirect = classes.has('migrating'); } },
    navigator: { onLine: online }, AbortController, setTimeout, clearTimeout,
    fetch: async (url, options) => {
      requested = { url, options }; hiddenDuringFetch = classes.has('migrating');
      if (fail) throw new Error('接続不可'); return { ok };
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { redirected, requested, hiddenDuringFetch, hiddenAtRedirect, hidden: classes.has('migrating') };
}

test('旧公開URLは接続を確認してケラバを指定し、入力や認証情報を送らず移動する', async () => {
  const result = await run();
  assert.equal(result.redirected, 'https://miyagoshigotono-lgtm.github.io/bolt-effective-length/#keraba');
  assert.equal(result.requested.url, 'https://miyagoshigotono-lgtm.github.io/bolt-effective-length/');
  assert.equal(result.requested.options.method, 'HEAD');
  assert.equal(result.requested.options.body, undefined);
  assert.equal(result.hiddenDuringFetch, true);
  assert.equal(result.hiddenAtRedirect, true);
  assert.equal(result.hidden, true);
});

test('オフライン・ローカル起動・社内配信・移行先の失敗では旧版を使い続ける', async () => {
  for (const options of [{ online: false }, { protocol: 'file:' }, { hostname: 'localhost' }, { ok: false }, { fail: true }]) {
    const result = await run(options);
    assert.equal(result.redirected, null);
    assert.equal(result.hidden, false);
    if (options.online === false || options.protocol || options.hostname) assert.equal(result.requested, null);
  }
});

test('移行先の接続待ちが時間切れになったら旧画面を表示する', async () => {
  const classes = new Set();
  let expire, cleared = false, redirected = false;
  vm.runInNewContext(source, {
    document: { documentElement: { classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) } } },
    location: { protocol: 'https:', hostname: 'miyagoshigotono-lgtm.github.io', replace: () => { redirected = true; } },
    navigator: { onLine: true }, AbortController,
    setTimeout(fn, delay) { assert.equal(delay, 4000); expire = fn; return 1; },
    clearTimeout(id) { assert.equal(id, 1); cleared = true; },
    fetch: (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('時間切れ')))),
  });
  assert.equal(classes.has('migrating'), true);
  expire();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(classes.has('migrating'), false);
  assert.equal(redirected, false);
  assert.equal(cleared, true);
});

test('旧画面を描く前に移行を開始し、既存アイコンの識別子と画像を維持して統合版を直接開く', () => {
  const html = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
  assert.ok(html.indexOf('html.migrating body{visibility:hidden}') < html.indexOf('<script src="migrate.js"></script>'));
  assert.ok(html.indexOf('<script src="migrate.js"></script>') < html.indexOf('<body'));
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/manifest.webmanifest'), 'utf8'));
  const base = 'https://miyagoshigotono-lgtm.github.io/kerabaCut/manifest.webmanifest';
  assert.equal(new URL(manifest.id, base).href, 'https://miyagoshigotono-lgtm.github.io/kerabaCut/index.html');
  assert.equal(new URL(manifest.start_url, base).href, 'https://miyagoshigotono-lgtm.github.io/bolt-effective-length/#keraba');
  assert.equal(new URL(manifest.scope, base).pathname, '/bolt-effective-length/');
  assert.deepEqual(manifest.icons.map((icon) => icon.src), ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png']);
});
