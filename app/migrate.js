(function () {
  'use strict';
  // 公開版だけを移行する。ファイル起動・社内配信とオフライン時は旧版を残す。
  if (location.protocol !== 'https:' || location.hostname !== 'miyagoshigotono-lgtm.github.io' || !navigator.onLine) return;
  // 本文の解析前に隠し、移行先へ接続できない場合だけ旧画面を表示する。
  const root = document.documentElement;
  root.classList.add('migrating');
  const target = 'https://miyagoshigotono-lgtm.github.io/bolt-effective-length/#keraba';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  // 同じドメインの保存キーを使うので、入力をURLや外部サーバーへ送る必要はない。
  fetch(target.split('#')[0], { method: 'HEAD', cache: 'no-store', signal: controller.signal })
    .then((response) => {
      if (response.ok) location.replace(target);
      else root.classList.remove('migrating');
    })
    .catch(() => { root.classList.remove('migrating'); })
    .finally(() => clearTimeout(timer));
})();
