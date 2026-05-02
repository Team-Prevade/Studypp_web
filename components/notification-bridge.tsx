"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getNotificationRuntimeAction } from "@/lib/notification-runtime-actions";

type RuntimeNotification = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  url: string | null;
  createdAt: string | Date;
};

const STORAGE_KEY = "studypp_notificacoes_mostradas";
const POLL_INTERVAL = 60_000;

function readShownIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(ids);
  } catch {
    return new Set<string>();
  }
}

function persistShownIds(ids: Set<string>) {
  const latest = Array.from(ids).slice(-80);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(latest));
}

function showBrowserNotification(notification: RuntimeNotification) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const native = new Notification(notification.titulo, {
    body: notification.mensagem,
    icon: "/favicon.svg",
    tag: notification.id,
  });

  native.onclick = () => {
    window.focus();
    if (notification.url) {
      window.location.href = notification.url;
    }
  };
}

export function NotificationBridge() {
  const shownIds = useRef<Set<string>>(new Set());
  const permissionToastShown = useRef(false);

  useEffect(() => {
    shownIds.current = readShownIds();

    const sync = async () => {
      const result = await getNotificationRuntimeAction();
      if (!result.success || !result.data) return;

      const { browserNotif, notifications } = result.data;

      if (
        browserNotif &&
        "Notification" in window &&
        Notification.permission === "default" &&
        !permissionToastShown.current
      ) {
        permissionToastShown.current = true;
        toast.info("Ativar notificações do browser?", {
          description: "Recebe alertas de lembretes e prazos enquanto a app estiver aberta.",
          action: {
            label: "Permitir",
            onClick: () => Notification.requestPermission(),
          },
        });
      }

      for (const notification of notifications.reverse()) {
        if (shownIds.current.has(notification.id)) continue;

        shownIds.current.add(notification.id);
        toast(notification.titulo, {
          description: notification.mensagem,
          action: notification.url
            ? {
                label: "Abrir",
                onClick: () => {
                  window.location.href = notification.url || "/notificacoes";
                },
              }
            : undefined,
        });

        if (browserNotif) {
          showBrowserNotification(notification);
        }
      }

      persistShownIds(shownIds.current);
    };

    sync();
    const interval = window.setInterval(sync, POLL_INTERVAL);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
