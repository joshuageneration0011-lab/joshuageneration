import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

// Convert base64 VAPID key to Uint8Array for push manager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Check if push is supported and we haven't asked recently
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const isSubscribed = localStorage.getItem('push_subscribed');
      const dismissed = localStorage.getItem('push_dismissed');
      
      if (!isSubscribed && !dismissed) {
        // Delay showing the prompt slightly so it's not aggressive
        setTimeout(() => setShowPrompt(true), 5000);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('push_dismissed', 'true');
    setShowPrompt(false);
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Wait for SW to be ready
        await navigator.serviceWorker.ready;
        
        // Fetch public key from backend
        const res = await fetch('/api/push/public-key');
        const data = await res.json();
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey)
        });

        // Send to backend
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });

        localStorage.setItem('push_subscribed', 'true');
        setShowPrompt(false);
      } else {
        handleDismiss();
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:w-96 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 flex gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-royal-blue-100 rounded-full flex items-center justify-center">
          <Bell className="w-6 h-6 text-royal-blue-600 animate-pulse" />
        </div>
        <div className="flex-1">
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h4 className="font-semibold text-slate-900 mb-1">Get Notified!</h4>
          <p className="text-sm text-slate-600 mb-4">
            Be the first to know when we post new sermons, blogs, and events.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="flex-1 bg-royal-blue-600 hover:bg-royal-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubscribing ? 'Allowing...' : 'Yes, notify me'}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
