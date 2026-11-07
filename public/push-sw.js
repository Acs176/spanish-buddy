// Pulled into the generated service worker (vite.config.js importScripts). sync.py sends { title, body } when new words arrive.
self.addEventListener("push", e => {
  const { title, body } = e.data?.json() ?? {};
  e.waitUntil(self.registration.showNotification(title || "Adrián", { body, icon: "icon-192.png", tag: "word" }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then(ws => ws[0]?.focus() ?? clients.openWindow(self.registration.scope)));
});
