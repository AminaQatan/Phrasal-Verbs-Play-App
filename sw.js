// Phrasal Verbs Play: keeps the game and its pictures on the phone so it opens like an app, even offline.
const CACHE = "phrasal-play-v1";
const PICS = Array.from({ length: 100 }, (_, i) => "./" + String(i + 1).padStart(3, "0") + ".webp");
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", ...PICS];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const save = (res) => {
    if (res && (res.ok || res.type === "opaque")) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  };
  // Pages: try the internet first so updates show, fall back to the saved copy offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(save).catch(() => caches.match(req).then((r) => r || caches.match("./index.html"))));
    return;
  }
  // Pictures, icons and fonts: use the saved copy first, fetch and save anything new.
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then(save)));
});
