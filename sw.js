import { GlobalSettings } from './src/game/GlobalSettings.js';

const CACHE_NAME = `guappo-${GlobalSettings.version}`;
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './src/Main.js',
  './lib/phaser.js',
  './lib/rexuiplugin.min.js',
  './assets/levels/levels.json',
  './favicon.ico',
  './src/game/Enum.js',
  './src/game/EventEmitter.js',
  './src/game/GameLogic.js',
  './src/game/GlobalSettings.js',
  './src/game/Level.js',
  './src/game/SaveGameHelper.js',
  './src/game/Utils.js',
  './src/objects/Cell.js',
  './src/objects/Enemy.js',
  './src/objects/Hero.js',
  './src/objects/MovablePiece.js',
  './src/scenes/SceneGameover.js',
  './src/scenes/SceneHome.js',
  './src/scenes/SceneMain.js',
  './src/scenes/ScenePreload.js',
  './src/scenes/SceneScores.js',
  './src/scenes/SceneSettings.js',
  './src/solver/Solver.js',
  './src/ui/Button.js',
  './src/ui/DragFeedback.js',
  './src/ui/IconButton.js',
  './src/ui/MyRexUIButton.js',
  './src/ui/SolverDialog.js',
  './src/ui/SpaceSlider.js',
  './assets/level_form.html',
  './assets/images/beehive.png',
  './assets/images/BoardBackground.png',
  './assets/images/ed1.png',
  './assets/images/ed2.png',
  './assets/images/eh1.png',
  './assets/images/eh2.png',
  './assets/images/ev1.png',
  './assets/images/ev2.png',
  './assets/images/friend1.png',
  './assets/images/friend2.png',
  './assets/images/gameover.png',
  './assets/images/gamewon.png',
  './assets/images/gap.png',
  './assets/images/Guappo_Junior_logo.png',
  './assets/images/hint.png',
  './assets/images/home.png',
  './assets/images/medal.png',
  './assets/images/play_circle.png',
  './assets/images/replay.png',
  './assets/images/settings.png',
  './assets/images/trap.png',
  './assets/images/vine.png',
  './assets/images/volume_off.png',
  './assets/images/volume_on.png',
  './assets/images/wappo.png'
];

// Listen for messages from the main page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_CACHE_VERSION') {
    // Reply with the cache version
    event.ports[0].postMessage({ cacheVersion: CACHE_NAME });
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('install', event => {
  console.log('Service Worker installing with cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files:', urlsToCache.length, 'files');
        return cache.addAll(urlsToCache);
      })
      .then(() => console.log('All files cached successfully'))
      .catch(error => console.error('Cache installation failed:', error))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('Cache hit for:', event.request.url);
          return response;
        }

        console.log('Cache miss for:', event.request.url, '- fetching from network');
        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache images and audio files
          if (event.request.url.includes('/assets/images/') ||
              event.request.url.includes('/assets/audio/') ||
              event.request.url.includes('.png') ||
              event.request.url.includes('.jpg') ||
              event.request.url.includes('.mp3') ||
              event.request.url.includes('.wav')) {
            console.log('Caching asset:', event.request.url);
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        });
      })
  );
});