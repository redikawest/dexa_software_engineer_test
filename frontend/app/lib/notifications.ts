import { apiFetch } from "./api";

export type NotificationItem = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  fields: string[];
  occurredAt: string;
  createdAt: string;
  isNew: boolean;
};

export type NotificationList = {
  unreadCount: number;
  items: NotificationItem[];
};

export function getNotifications(token: string): Promise<NotificationList> {
  return apiFetch<NotificationList>("/admin/notifications", { token });
}

export function markNotificationsSeen(token: string, seenUntil: string): Promise<{ unreadCount: number }> {
  return apiFetch<{ unreadCount: number }>("/admin/notifications/seen", {
    method: "POST",
    token,
    body: { seenUntil },
  });
}

const FIELD_LABELS: Record<string, string> = {
  phone: "phone number",
  photoUrl: "photo",
  password: "password",
};

export function describeNotification(item: NotificationItem): string {
  const labels = item.fields.map((field) => FIELD_LABELS[field] ?? field);
  const what = labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}` : labels[0];
  return `${item.employeeName ?? "An employee"} changed their ${what}`;
}
