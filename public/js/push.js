function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function initPushSettings() {
    const pushToggle = document.getElementById('pushToggle');
    if (!pushToggle) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        pushToggle.disabled = true;
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.getSubscription();
        
        let isSubscribed = false;
        
        if (subscription) {
            // Check status in backend to be sure
            const response = await fetch('/api/push/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            const data = await response.json();
            isSubscribed = data.isSubscribed;
        }

        pushToggle.checked = isSubscribed;
        pushToggle.disabled = false; // Enable only if SW works

        pushToggle.addEventListener('change', async (e) => {
            pushToggle.disabled = true;
            try {
                if (pushToggle.checked) {
                    await subscribeUser(registration);
                } else {
                    await unsubscribeUser(registration);
                }
            } catch (err) {
                console.error('Erro na configuração de push', err);
                pushToggle.checked = !pushToggle.checked; // Revert visually
                
                // Melhorando as mensagens de erro
                if (err.message.includes('permission')) {
                    alert('Permissão negada! Você precisa permitir as notificações nas configurações do navegador/celular.');
                } else if (err.message.includes('VAPID')) {
                    alert('Erro no servidor: Chaves de segurança não configuradas. Contate o administrador.');
                } else {
                    alert('Erro ao configurar notificações: ' + err.message);
                }
            } finally {
                pushToggle.disabled = false;
            }
        });
    } catch (error) {
        console.error('Service Worker Error', error);
        alert('Seu dispositivo não suporta notificações deste site. No iPhone, adicione o site à "Tela de Início" primeiro.');
    }
}

async function subscribeUser(registration) {
    const vapidPublicKey = window.VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) throw new Error('VAPID public key not found');

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
    });

    const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
    });

    if (!response.ok) {
        throw new Error('Falha ao salvar a inscrição no servidor');
    }
}

async function unsubscribeUser(registration) {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        const endpoint = subscription.endpoint;
        const successful = await subscription.unsubscribe();
        if (successful) {
            const response = await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ endpoint })
            });
            if (!response.ok) {
                console.warn('Falha ao remover a inscrição no servidor, mas foi removida localmente.');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', initPushSettings);
