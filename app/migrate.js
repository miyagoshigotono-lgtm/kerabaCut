(function () {
  'use strict';
  // 公開版だけを移行する。ファイル起動・社内配信とオフライン時は旧版を残す。
  if (location.protocol !== 'https:' || location.hostname !== 'miyagoshigotono-lgtm.github.io' || !navigator.onLine) return;
  const target = 'https://miyagoshigotono-lgtm.github.io/bolt-effective-length/#keraba';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  // 同じドメインの保存キーを使うので、入力をURLや外部サーバーへ送る必要はない。
  fetch(target.split('#')[0], { method: 'HEAD', cache: 'no-store', signal: controller.signal })
    .then((response) => { if (response.ok) location.replace(target); })
    .catch(() => { /* 統合版へ接続できなければ旧版の入力・作図を続ける。 */ })
    .finally(() => clearTimeout(timer));
})();
