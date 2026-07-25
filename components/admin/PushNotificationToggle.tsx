"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { translate, type Lang } from "@/lib/i18n/translate";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "loading" | "off" | "on";

export function PushNotificationToggle({ lang = "en" }: { lang?: Lang }) {
  const [status, setStatus] = useState<Status>("loading");
  const t = (key: string) => translate(lang, key);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    });
  }, []);

  async function enable() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    setStatus("loading");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("off");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    await fetch("/api/admin/push-subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
    setStatus("on");
  }

  async function disable() {
    setStatus("loading");
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch("/api/admin/push-subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    setStatus("off");
  }

  if (status === "unsupported" || status === "loading") return null;

  return (
    <button
      onClick={status === "on" ? disable : enable}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
      title={status === "on" ? t("admin.push.enabled") : t("admin.push.disabled")}
    >
      {status === "on" ? <Bell size={14} /> : <BellOff size={14} />}
      {status === "on" ? t("admin.push.enabled") : t("admin.push.enable")}
    </button>
  );
}
