/* ケラバ図メーカー Service Worker
   方針：オンラインなら必ず最新を取りに行き（network-first）、
         つながらないときだけキャッシュを使う。
         → サーバー側のファイルを差し替えるだけで全員が更新される。 */
const VERSION = 'keraba-v1.0.5';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
                './icon-192.png', './icon-512.png', './icon-512-maskable.png'];

self.addEventListener('install', e=>{
  e.waitUntil((async ()=>{
    const c = await caches.open(VERSION);
    // addAll は1つでも失敗すると全部入らないので、1件ずつ入れる
    for(const url of ASSETS){
      try{ await c.add(url); }catch(err){ /* この1件だけ諦める */ }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=> k!==VERSION).map(k=> caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith((async ()=>{
    try{
      // 画面の読み込み（F5含む）はブラウザキャッシュを無視して必ず取りに行く
      const res = (req.mode === 'navigate')
        ? await fetch(new Request(req.url, {cache:'reload', credentials:'same-origin'}))
        : await fetch(req);
      if(res && res.ok){
        const copy = res.clone();
        // 書き込み完了までワーカーを止めない
        e.waitUntil(caches.open(VERSION).then(c=> c.put(req, copy)).catch(()=>{}));
      }
      return res;
    }catch(err){
      const hit = await caches.match(req);
      if(hit) return hit;
      if(req.mode === 'navigate'){
        const idx = await caches.match('./index.html');
        if(idx) return idx;
      }
      throw err;
    }
  })());
});
