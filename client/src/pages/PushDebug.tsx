import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PushDebug() {
  const { user, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [subStatus, setSubStatus] = useState<any>(null);

  const log = (msg: string) => {
    const t = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${t}] ${msg}`]);
  };

  useEffect(() => {
    log("Page loaded");
    log("SW support: " + ("serviceWorker" in navigator));
    log("PushManager support: " + ("PushManager" in window));
    log("Notification support: " + ("Notification" in window));
    if ("Notification" in window) {
      log("Notification.permission: " + Notification.permission);
    }
    log("isAuthenticated: " + !!isAuthenticated);
    log("user: " + (user ? JSON.stringify({ id: user.id, email: user.email }) : "null"));
  }, [isAuthenticated, user]);

  const checkServerStatus = async () => {
    try {
      log("Checking server push status...");
      const res = await fetch("/api/push/status", { credentials: "include" });
      const data = await res.json();
      log("Server status: " + JSON.stringify(data));
      setSubStatus(data);
    } catch (err: any) {
      log("Server status error: " + err.message);
    }
  };

  const checkBrowserSub = async () => {
    try {
      log("Checking browser subscription...");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        log("Browser has subscription: " + sub.endpoint.substring(0, 80) + "...");
      } else {
        log("Browser has NO subscription");
      }
    } catch (err: any) {
      log("Browser check error: " + err.message);
    }
  };

  const doManualSubscribe = async () => {
    try {
      log("Step 1: Requesting permission...");
      const perm = await Notification.requestPermission();
      log("Permission result: " + perm);

      if (perm !== "granted") {
        log("STOPPED: permission not granted");
        return;
      }

      log("Step 2: Getting VAPID key...");
      const vapidRes = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await vapidRes.json();
      log("VAPID key: " + (publicKey ? publicKey.substring(0, 20) + "..." : "MISSING"));

      if (!publicKey) {
        log("STOPPED: no VAPID key");
        return;
      }

      log("Step 3: Getting SW registration...");
      const registration = await navigator.serviceWorker.ready;
      log("SW ready");

      log("Step 4: Checking existing subscription...");
      let sub = await registration.pushManager.getSubscription();
      if (sub) {
        log("Found existing sub, unsubscribing first...");
        await sub.unsubscribe();
        log("Unsubscribed old");
      }

      log("Step 5: Creating new subscription...");
      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const appServerKey = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) appServerKey[i] = rawData.charCodeAt(i);

      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
      log("New subscription created: " + sub.endpoint.substring(0, 80));

      log("Step 6: Sending to server...");
      const subJson = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });
      const resData = await res.json();
      log("Server response (" + res.status + "): " + JSON.stringify(resData));

      if (res.ok) {
        log("SUCCESS! Subscription registered.");
      }
    } catch (err: any) {
      log("ERROR: " + err.message);
    }
  };

  const sendTestNotification = async () => {
    try {
      log("Sending test notification...");
      const res = await fetch("/api/push/test", { method: "POST", credentials: "include" });
      const data = await res.json();
      log("Test result: " + JSON.stringify(data));
    } catch (err: any) {
      log("Test error: " + err.message);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-push-debug-title">Push Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button data-testid="button-check-browser" onClick={checkBrowserSub} size="sm">Browser Check</Button>
            <Button data-testid="button-check-server" onClick={checkServerStatus} size="sm">Server Check</Button>
            <Button data-testid="button-manual-subscribe" onClick={doManualSubscribe} size="sm" variant="default">Manual Subscribe</Button>
            <Button data-testid="button-test-push" onClick={sendTestNotification} size="sm" variant="default">Test Push</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-md text-xs font-mono max-h-96 overflow-y-auto space-y-1">
            {logs.map((l, i) => (
              <div key={i} data-testid={`text-log-${i}`}>{l}</div>
            ))}
            {logs.length === 0 && <div className="text-muted-foreground">No logs yet</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
