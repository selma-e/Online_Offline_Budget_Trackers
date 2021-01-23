const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/index.js",
  "/db.js",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// install
self.addEventListener("install", function (evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch READDDDDD
self.addEventListener("fetch", function (evt) {
  // cache successful requests to the API
  if (evt.request.url.includes("/api/")) {
    console.log(evt.request.url);
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

  // if the request is not for the API, serve static assets using "offline-first" approach.
  // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
  evt.respondWith(
    caches.match(evt.request).then(function (response) {
      return response || fetch(evt.request);
    })
  );
});


// // Inside of webpack.config.js:
// const WorkboxPlugin = require('workbox-webpack-plugin');

// module.exports = {
//   // Other webpack config...

//   plugins: [
//     // Other plugins...

//     new WorkboxPlugin.GenerateSW({
//       // Do not precache images
//       exclude: [/\.(?:png|jpg|jpeg|svg)$/],

//       // Define runtime caching rules.
//       runtimeCaching: [{
//         // Match any request that ends with .png, .jpg, .jpeg or .svg.
//         urlPattern: /\.(?:png|jpg|jpeg|svg)$/,

//         // Apply a cache-first strategy.
//         handler: 'CacheFirst',

//         options: {
//           // Use a custom cache name.
//           cacheName: 'images',

//           // Only cache 10 images.
//           expiration: {
//             maxEntries: 10,
//           },
//         },
//       }],
//     })
//   ]
// };