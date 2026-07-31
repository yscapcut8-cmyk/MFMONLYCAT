// Service Worker para lidar com Web Push Notifications

self.addEventListener('push', function(event) {
    if (event.data) {
        let data;
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Nova Venda!', body: event.data.text() };
        }
        
        const title = data.title || 'Nova Venda!';
        const options = {
            body: data.body || 'Você recebeu uma nova venda.',
            icon: '/favicon.ico', // Update icon path if a better icon is available
            badge: '/favicon.ico',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            data: {
                url: data.url || '/'
            }
        };
        
        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
