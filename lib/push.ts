import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// Fire-and-forget: pushes a browser/OS notification to every admin device
// that has notifications enabled. Never throws — a missing VAPID config or a
// dead subscription must not break the request that triggered it (a new
// suggestion or user signup).
export async function sendPushToAdmins(title: string, body: string, url: string) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { user: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } },
  });
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, body, url });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: any) {
        // 404/410 = the browser has unsubscribed or the subscription expired.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
