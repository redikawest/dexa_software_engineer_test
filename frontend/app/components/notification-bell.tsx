import { useCallback, useEffect, useRef, useState } from "react";

import { formatRelative } from "~/lib/date";
import {
  describeNotification,
  getNotifications,
  markNotificationsSeen,
  type NotificationList,
} from "~/lib/notifications";
import { useAuthorized } from "~/lib/use-authorized";

const POLL_MS = 15_000;
const TOAST_MS = 8_000;

export function NotificationBell() {
  const call = useAuthorized("HR_ADMIN");
  const [list, setList] = useState<NotificationList | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const known = useRef<Set<string> | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    let latest: NotificationList | null;
    try {
      latest = await call(getNotifications);
    } catch {
      return;
    }
    if (!latest) return;

    const ids = new Set(latest.items.map((item) => item.id));
    if (known.current === null) {
      if (latest.unreadCount > 0) setToast(`${latest.unreadCount} profile ${latest.unreadCount === 1 ? "change" : "changes"} to look at`);
    } else {
      const arrived = latest.items.filter((item) => item.isNew && !known.current!.has(item.id));
      if (arrived.length === 1) setToast(describeNotification(arrived[0]));
      else if (arrived.length > 1) setToast(`${arrived.length} new profile changes`);
    }
    known.current = ids;
    setList(latest);
  }, [call]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  async function toggle() {
    setToast(null);
    if (open) return setOpen(false);

    setOpen(true);
    if (!list || list.unreadCount === 0) {
      setHighlight(new Set());
      return;
    }

    setHighlight(new Set(list.items.filter((item) => item.isNew).map((item) => item.id)));
    const seenUntil = list.items[0].createdAt;
    setList({ ...list, unreadCount: 0 });
    try {
      await call((token) => markNotificationsSeen(token, seenUntil));
    } catch {
      void load();
    }
  }

  const unread = list?.unreadCount ?? 0;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} not seen` : "Notifications"}
        aria-expanded={open}
        className="relative rounded-full p-1.5 text-gray-600 hover:bg-gray-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
          aria-hidden
        >
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9ZM10 19a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-medium leading-4.5 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 z-30 rounded-xl border border-gray-200 bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          <p className="border-b border-gray-100 px-4 py-3 text-sm font-medium">Profile changes</p>
          {!list || list.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">Nothing yet. Changes made by employees show up here.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {list.items.map((item) => (
                <li key={item.id} className={`px-4 py-3 text-sm ${highlight.has(item.id) || item.isNew ? "bg-blue-50" : ""}`}>
                  <p>{describeNotification(item)}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{formatRelative(item.occurredAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {toast && (
        <button
          type="button"
          role="status"
          onClick={toggle}
          className="fixed right-4 top-16 z-40 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-blue-200 bg-white px-4 py-3 text-left text-sm shadow-lg"
        >
          <span className="block font-medium text-blue-700">Profile change</span>
          <span className="block text-gray-700">{toast}</span>
        </button>
      )}
    </div>
  );
}
