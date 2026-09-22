"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  BadgeCheck,
  Mail,
  FileText,
  CalendarDays,
  CreditCard,
  Settings,
  Info,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { refreshUnreadCount } from "@/hooks/useUnreadCount";
import { API_ROUTES } from "@/lib/constants";
import { Notification, NotificationType } from "@/types";
import { formatDateTime } from "@/lib/utils";

// ─── Icon map by type ─────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  VERIFICATION: { icon: BadgeCheck, color: "text-blue-600", bg: "bg-blue-50" },
  INVITATION: { icon: Mail, color: "text-purple-600", bg: "bg-purple-50" },
  PRESCRIPTION: { icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
  APPOINTMENT: { icon: CalendarDays, color: "text-amber-600", bg: "bg-amber-50" },
  PAYMENT: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
  SUBSCRIPTION: { icon: CreditCard, color: "text-primary", bg: "bg-primary/10" },
  SYSTEM: { icon: Settings, color: "text-gray-600", bg: "bg-gray-100" },
  USER_ACTION: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
};

// ─── Single notification card ─────────────────────────────────────────────────
function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.SYSTEM;
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
        notification.isRead
          ? "border-outline-variant bg-surface"
          : "border-primary/20 bg-primary/5"
      }`}
    >
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
      >
        <Icon className={`h-5 w-5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${notification.isRead ? "text-on-surface-variant" : "text-on-surface"}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[11px] text-on-surface-variant/60 mt-1.5">
          {formatDateTime(notification.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!notification.isRead && (
          <button
            onClick={() => onMarkRead(notification.id)}
            title="Mark as read"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          title="Delete"
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-outline-variant/30 ${className}`} />;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(API_ROUTES.NOTIFICATIONS.LIST);
      setNotifications(res.data?.data || res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(API_ROUTES.NOTIFICATIONS.MARK_READ(id));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      // Keep the sidebar badge in step with this page immediately.
      await refreshUnreadCount();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch(API_ROUTES.NOTIFICATIONS.MARK_ALL_READ);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshUnreadCount();
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.delete(API_ROUTES.NOTIFICATIONS.DELETE(id));
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await refreshUnreadCount();
    } catch {}
  };

  const displayed = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-on-surface">Notifications</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Your recent system notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadNotifications}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-outline-variant">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              filter === f
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {f}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-xs bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-16 w-16 rounded-2xl bg-surface-container flex items-center justify-center">
            <BellOff className="h-8 w-8 text-on-surface-variant/40" />
          </div>
          <p className="text-on-surface-variant font-medium">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-xs text-on-surface-variant/60">
            Notifications about verifications, invitations, and more will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={markRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
