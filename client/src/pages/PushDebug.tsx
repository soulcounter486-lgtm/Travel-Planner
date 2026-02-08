import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PushDebug() {
  const { user, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => {
    const t = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${t}] ${msg}`]);
  };

  useEffect(() => {
    log("Page loaded");
    log("SW: " + ("serviceWorker" in navigator) + " | Push: " + ("PushManager" in window) + " | Notif: " + ("Notification" in window));
    if ("Notification" in window) log("Permission: " + Notification.permission);
    log("Auth: " + !!isAuthenticated + " | User: " + (user ? user.id : "null"));
  }, [isAuthenticated, user]);

  const checkAll = async () => {
    try {
      log("--- Full Check ---");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      log("Browser sub: " + (sub ? sub.endpoint.substring(0, 80) : "NONE"));

      const statusRes = await fetch("/api/push/status", { credentials: "include" });
      const statusData = await statusRes.json();
      log("Server status: " + JSON.stringify(statusData));

      const debugRes = await fetch("/api/push/debug", { credentials: "include" });
      const debugData = await debugRes.json();
      log("DB total subs: " + debugData.totalSubscriptions);
      log("Admin users: " + JSON.stringify(debugData.adminUsers));
      if (debugData.subscriptions?.length > 0) {
        debugData.subscriptions.forEach((s: any) => {
          log("  Sub: userId=" + s.userId + " ep=" + s.endpoint);
        });
      }
    } catch (err: any) {
      log("Check error: " + err.message);
    }
  };

  const doManualSubscribe = async () => {
    try {
      log("=== Manual Subscribe ===");
      const perm = await Notification.requestPermission();
      log("1. Permission: " + perm);
      if (perm !== "granted") { log("STOP: denied"); return; }

      const vapidRes = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await vapidRes.json();
      log("2. VAPID: " + (publicKey ? publicKey.substring(0, 20) + "..." : "MISSING"));
      if (!publicKey) { log("STOP: no key"); return; }

      const registration = await navigator.serviceWorker.ready;
      log("3. SW ready");

      let sub = await registration.pushManager.getSubscription();
      if (sub) {
        log("4. Old sub found, removing...");
        await sub.unsubscribe();
      }

      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const appServerKey = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) appServerKey[i] = rawData.charCodeAt(i);

      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
      log("5. New sub: " + sub.endpoint.substring(0, 80));

      const subJson = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });
      const resData = await res.json();
      log("6. Server (" + res.status + "): " + JSON.stringify(resData));
    } catch (err: any) {
      log("ERROR: " + err.message);
    }
  };

  const sendTestPush = async () => {
    try {
      log("Sending test push...");
      const res = await fetch("/api/push/test", { method: "POST", credentials: "include" });
      const data = await res.json();
      log("Test: " + JSON.stringify(data));
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
            <Button data-testid="button-check-all" onClick={checkAll} size="sm">Full Check</Button>
            <Button data-testid="button-manual-subscribe" onClick={doManualSubscribe} size="sm" variant="default">Subscribe</Button>
            <Button data-testid="button-test-push" onClick={sendTestPush} size="sm" variant="default">Test Push</Button>
            <Button data-testid="button-clear-logs" onClick={() => setLogs([])} size="sm" variant="outline">Clear</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-md text-xs font-mono max-h-[60vh] overflow-y-auto space-y-1">
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
