export type NotificationCategory =
  | "Finance"
  | "Admission"
  | "HR"
  | "Academic"
  | "Attendance"
  | "System"
  | "Admin"
  | "Settings";

export type AdminNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  href: string;
  unread: boolean;
};

export type NotificationDateGroup = {
  label: string;
  items: AdminNotification[];
};

export function readStorageKey(schoolId: string) {
  return `admin-notifications-read:${schoolId}`;
}

export function buildDefaultNotifications(schoolId: string): AdminNotification[] {
  const base = `/schools/${schoolId}/admin`;
  const now = Date.now();

  return [
    {
      id: "fee-reminder-10a",
      category: "Finance",
      title: "Fee reminder sent",
      body: "Class 10-A fee reminders were delivered to 42 parents.",
      createdAt: new Date(now - 2 * 60 * 1000).toISOString(),
      href: `${base}/finance/fees`,
      unread: true,
    },
    {
      id: "admission-grade-6",
      category: "Admission",
      title: "New admission inquiry",
      body: "A parent submitted an admission form for Grade 6.",
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      href: `${base}/admission/enquiries`,
      unread: true,
    },
    {
      id: "staff-attendance-sync",
      category: "HR",
      title: "Staff attendance synced",
      body: "Today's teaching staff attendance has been updated.",
      createdAt: new Date(now - 22 * 60 * 60 * 1000).toISOString(),
      href: `${base}/hr/teaching-staff`,
      unread: false,
    },
    {
      id: "low-attendance-8b",
      category: "Attendance",
      title: "Low attendance alert",
      body: "3 students in Class 8-B dropped below the 80% threshold.",
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      href: `${base}/academic/attendance`,
      unread: true,
    },
    {
      id: "maintenance-notice",
      category: "System",
      title: "Scheduled maintenance",
      body: "Portal maintenance is planned tonight from 11:00 PM to 2:00 AM.",
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      href: `${base}/notifications`,
      unread: false,
    },
  ];
}

export function loadReadIds(schoolId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(readStorageKey(schoolId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadIds(schoolId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(readStorageKey(schoolId), JSON.stringify([...ids]));
}

export function withReadState(
  notifications: Omit<AdminNotification, "unread">[],
  readIds: Set<string>
): AdminNotification[] {
  return notifications.map((n) => ({
    ...n,
    unread: !readIds.has(n.id),
  }));
}

export function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDateTime(iso);
}

export function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getDateGroupLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function groupNotificationsByDate(notifications: AdminNotification[]): NotificationDateGroup[] {
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const groups = new Map<string, AdminNotification[]>();
  for (const item of sorted) {
    const label = getDateGroupLabel(item.createdAt);
    const existing = groups.get(label) ?? [];
    existing.push(item);
    groups.set(label, existing);
  }

  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

export function mapFirestoreNotification(
  id: string,
  data: Record<string, unknown>,
  schoolId: string
): Omit<AdminNotification, "unread"> {
  const base = `/schools/${schoolId}/admin`;
  const createdAt =
    typeof data.createdAt === "object" && data.createdAt !== null && "toDate" in data.createdAt
      ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
      : typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString();

  const category = (data.category as NotificationCategory) || "System";
  const href =
    typeof data.href === "string"
      ? data.href
      : category === "Finance"
        ? `${base}/finance/fees`
        : category === "Admission"
          ? `${base}/admission/enquiries`
          : category === "HR"
            ? `${base}/hr/teaching-staff`
            : category === "Attendance" || category === "Academic"
              ? `${base}/academic/attendance`
              : `${base}/notifications`;

  return {
    id,
    category,
    title: String(data.title || "New notification"),
    body: String(data.description || data.body || ""),
    createdAt,
    href,
  };
}
