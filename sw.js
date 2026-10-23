// オフラインでも開けるようにするためのサービスワーカー
//   いつもはネットから最新を取る（更新がすぐ届くように）。つながらんときだけ保存しといた分を出す。
//   Apps Script とのやりとり（別のサイト宛て）には手を出さん。
const CACHE = 'kondate-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    // no-cache：ブラウザが覚えとるファイルでも、毎回「変わってへん？」と GitHub に確認する（変わってなければ一瞬で終わる）
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./')))
  );
});
