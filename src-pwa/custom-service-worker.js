/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */

/*
  dependencies
*/

  import {precacheAndRoute} from 'workbox-precaching'
  import {registerRoute} from 'workbox-routing'
  import {StaleWhileRevalidate} from 'workbox-strategies'
  import {CacheFirst} from 'workbox-strategies'
  import {ExpirationPlugin} from 'workbox-expiration'
  import {CacheableResponsePlugin} from 'workbox-cacheable-response'
  import {NetworkFirst} from 'workbox-strategies';
  import {Queue} from 'workbox-background-sync';
  
/*
  config
*/

  precacheAndRoute(self.__WB_MANIFEST);

  let backgroundSyncSupported = 'sync' in self.registration ? true : false
  console.log('backgroundSyncSupported: ', backgroundSyncSupported)

/*
  queue - createPost
*/

  let createItemQueue = null
  if (backgroundSyncSupported) {
    createItemQueue = new Queue('createItemQueue');
  }

/*
  caching strategies
*/

  registerRoute(
    ({url}) => url.host.startsWith('fonts.g'),
    new CacheFirst({
      cacheName: 'google-fonts',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 30,
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200]
        }),
      ],
    })
  );

  registerRoute(
    ({url}) => url.pathname.startsWith('/posts'),
    new NetworkFirst()
  );

  registerRoute(
    ({url}) => url.href.startsWith('http'),
    new StaleWhileRevalidate()
  );

/*
  events - fetch
*/

  if (backgroundSyncSupported) {
    self.addEventListener('fetch', (event) => {
      if (event.request.url.startsWith(`${ process.env.API }/createItem`)) {
        // Clone the request to ensure it's safe to read when
        // adding to the Queue.
        if (!self.navigator.onLine) {
          const promiseChain = fetch(event.request.clone()).catch((err) => {
            return createItemQueue.pushRequest({request: event.request});
          });
          event.waitUntil(promiseChain);
        }
      }
    });
  }

/*
  events - push
*/

self.addEventListener('push', event => {
  console.log('Push message received:', event)
  if (event.data) {
    let data = JSON.parse(event.data.text())
    event.waitUntil(
      self.registration.showNotification(data.title)
    )
  }
})

/*
  events - Notificationclick
*/

self.addEventListener('notificationclick', event => {
  event.waitUntil(
    event.waitUntil(
      clients.matchAll().then(clis => {
        let clientUsingApp = clis.find(cli => {
          return cli.visibilityState === 'visible'
        })
        if (clientUsingApp) {
          clientUsingApp.navigate('/#/')
          clientUsingApp.focus()
        }
        else {
          clients.openWindow('/#/')
        }
      })
    ) 
  )
})