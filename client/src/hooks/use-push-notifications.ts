import { useState, useEffect, useCallback, useRef } from "react";

export function usePushNotifications(autoSubscribe: boolean = false, isLoggedIn: boolean = false) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const autoSubscribeAttempted = useRef(false);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    console.log("[PUSH] Support check - SW:", "serviceWorker" in navigator, "PushManager:", "PushManager" in window, "Permission:", Notification?.permission);
  }, []);

  useEffect(() => {
    console.log("[PUSH] Auto-subscribe check - autoSubscribe:", autoSubscribe, "isLoggedIn:", isLoggedIn, "isSupported:", isSupported, "attempted:", autoSubscribeAttempted.current);
    
    if (!autoSubscribe || !isLoggedIn || !isSupported || autoSubscribeAttempted.current) return;
    autoSubscribeAttempted.current = true;

    const doAutoSubscribe = async () => {
      try {
        let perm = Notification.permission;
        console.log("[PUSH] Current permission:", perm);
        
        if (perm === "default") {
          perm = await Notification.requestPermission();
          setPermission(perm);
          console.log("[PUSH] Permission after request:", perm);
        }
        if (perm === "denied") {
          console.log("[PUSH] Permission DENIED - cannot subscribe");
          return;
        }
        if (perm !== "granted") {
          console.log("[PUSH] Permission not granted:", perm);
          return;
        }

        console.log("[PUSH] Fetching VAPID key...");
        const vapidRes = await fetch("/api/push/vapid-public-key");
        const { publicKey } = await vapidRes.json();
        if (!publicKey) {
          console.error("[PUSH] No VAPID public key!");
          return;
        }
        console.log("[PUSH] VAPID key received");

        const registration = await navigator.serviceWorker.ready;
        console.log("[PUSH] Service worker ready");
        
        let sub = await registration.pushManager.getSubscription();
        console.log("[PUSH] Existing subscription:", sub ? "yes" : "no");

        if (!sub) {
          console.log("[PUSH] Creating new subscription...");
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
          console.log("[PUSH] New subscription created");
        }

        if (sub) {
          const subJson = sub.toJSON();
          console.log("[PUSH] Sending to server, endpoint:", subJson.endpoint?.substring(0, 80));
          const res = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
          });
          const resData = await res.json().catch(() => ({}));
          if (res.ok) {
            setIsSubscribed(true);
            console.log("[PUSH] Server registration OK:", JSON.stringify(resData));
          } else {
            console.error("[PUSH] Server registration FAILED:", res.status, JSON.stringify(resData));
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
