/// <reference lib="webworker" />
/**
 * Carmat Service Worker — injectManifest mode (Workbox precache + Web Push).
 * Bu dosya build sırasında dist/client/sw.js olarak çıkar.
 */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Workbox precache (Astro'nun injectManifest'i build sırasında doldurur)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Service worker hemen aktif olsun (yeni versiyon push edildiğinde bekleme yok)
self.addEventListener('install', () => {
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

/**
 * Push notification gelince OS bildirimi göster.
 * Server tarafı `web-push` paketiyle aşağıdaki şekilde gönderir:
 *  payload = { title, body, url?, tag?, icon? }
 */
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data: any = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Carmat', body: event.data.text() }
  }
  const title = data.title ?? 'Carmat'
  const body = data.body ?? ''
  const url = data.url ?? '/'
  const tag = data.tag ?? 'carmat'
  const icon = data.icon ?? '/icons/icon-192.png'
  const badge = data.badge ?? '/icons/icon-192.png'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data: { url },
      renotify: true,
      requireInteraction: data.requireInteraction === true,
    } as NotificationOptions),
  )
})

/**
 * Bildirime tıklayınca ilgili sayfayı aç (varsa zaten açık tab'a focus).
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && (event.notification.data as any).url) || '/'
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clientList) {
        // Aynı origin'de açık bir tab varsa odaklan
        if ('focus' in client) {
          (client as WindowClient).focus()
          if ('navigate' in client) {
            try {
              await (client as WindowClient).navigate(url)
            } catch {}
          }
          return
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(url)
      }
    })(),
  )
})

/**
 * Push subscription değişince (yenileme/expire) — opsiyonel, server'a yeni subscription'ı bildir.
 */
self.addEventListener('pushsubscriptionchange' as any, ((event: any) => {
  event.waitUntil(
    (async () => {
      try {
        const newSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: (event.oldSubscription as any)?.options?.applicationServerKey,
        })
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: newSub.toJSON(), audience: 'admin' }),
        })
      } catch {}
    })(),
  )
}) as EventListener)
