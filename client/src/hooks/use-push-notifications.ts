import { useState, useEffect, useCallback } from "react";

export function usePushNotifications(autoSubscribe: boolean = false, isLoggedIn: boolean = false) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    if (supported) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            setIsSubscribed(true);
          }
        } catch (err) {
          console.error("[PUSH] Check subscription error:", err);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!autoSubscribe || !isLoggedIn || !isSupported) return;

    const doAutoSubscribe = async () => {
      try {
        let perm = Notification.permission;
        if (perm === "default") {
          perm = await Notification.requestPermission();
          setPermission(perm);
        }
        if (perm !== "granted") return;

        const vapidRes = await fetch("/api/push/vapid-public-key");
        const { publicKey } = await vapidRes.json();
        if (!publicKey) return;

        const registration = await navigator.serviceWorker.ready;
        let sub = await registration.pushManager.getSubscription();

        if (sub) {
          const existingKey = sub.options?.applicationServerKey;
          const newKey = urlBase64ToUint8Array(publicKey);
          let keyMatch = false;
          if (existingKey) {
            const existingArr = new Uint8Array(existingKey);
            keyMatch = existingArr.length === newKey.length && existingArr.every((v, i) => v === newKey[i]);
          }
          if (!keyMatch) {
            await sub.unsubscribe();
            sub = null;
          }
        }

        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        if (sub) {
          const subJson = sub.toJSON();
          const res = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
          });
          if (res.ok) {
            setIsSubscribed(true);
          }
        }
      } catch (err) {
        console.error("[PUSH] Auto subscribe error:", err);
      }
    };

    doAutoSubscribe();
  }, [autoSubscribe, isLoggedIn, isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== "granted") {
        setIsLoading(false);
        return false;
      }

      const vapidResponse = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await vapidResponse.json();

      if (!publicKey) throw new Error("VAPID public key not available");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Subscribe error:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Unsubscribe error:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
