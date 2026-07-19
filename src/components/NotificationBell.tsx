import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, CheckCheck, Wallet, Gift, Crown, Info, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listMyNotifications, getUnreadCount, markNotificationRead, markAllRead } from "@/lib/notifications.functions";
import { supabase } from "@/integrations/supabase/client";

type Notif = {
  id: string;
  category: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  is_broadcast: boolean;
  created_at: string;
  is_read: boolean;
};

const CATEGORY_META: Record<string, { icon: typeof Bell; color: string }> = {
  wallet: { icon: Wallet, color: "from-emerald-500 to-teal-500" },
  bonus: { icon: Gift, color: "from-fuchsia-500 to-pink-500" },
  vip: { icon: Crown, color: "from-amber-500 to-orange-500" },
  system: { icon: Info, color: "from-indigo-500 to-blue-500" },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const fetchList = useServerFn(listMyNotifications);
  const fetchUnread = useServerFn(getUnreadCount);
  const markOne = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllRead);

  const loadUnread = useCallback(async () => {
    try {
      const { count } = await fetchUnread();
      setUnread(count);
    } catch {}
  }, [fetchUnread]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications } = await fetchList({ data: { limit: 30 } });
      setItems(notifications as Notif[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "লোড ব্যর্থ");
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 30_000);
    return () => clearInterval(t);
  }, [loadUnread]);

  // Realtime updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notif-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: any) => {
          const row = payload.new;
          if (row.user_id === userId || row.is_broadcast) {
            setUnread((u) => u + 1);
            if (open) loadItems();
            toast(row.title, { description: row.body ?? undefined });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, open, loadItems]);

  useEffect(() => {
    if (open) loadItems();
  }, [open, loadItems]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function handleClick(n: Notif) {
    if (!n.is_read) {
      try {
        await markOne({ data: { id: n.id } });
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        setUnread((u) => Math.max(0, u - 1));
      } catch {}
    }
  }

  async function handleMarkAll() {
    try {
      await markAll();
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
      toast.success("সব পড়া হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ব্যর্থ");
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="নোটিফিকেশন"
        className="relative grid h-8 w-8 place-items-center rounded-full bg-gold-button text-[var(--background)]"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--neon-pink)] px-1 text-[10px] font-bold text-white animate-pulse">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-[var(--neon-gold)]/40 bg-[#0b1f14]/98 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-sm font-black text-white">নোটিফিকেশন</div>
              <div className="text-[10px] text-white/60">{unread > 0 ? `${unread} নতুন` : "সব পড়া হয়েছে"}</div>
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20"
                >
                  <CheckCheck className="h-3 w-3" /> সব পড়েছি
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/50">লোড হচ্ছে…</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/50">কোনো নোটিফিকেশন নেই</div>
            ) : (
              items.map((n) => {
                const meta = CATEGORY_META[n.category] ?? CATEGORY_META.system;
                const Icon = meta.icon;
                const Content = (
                  <div
                    onClick={() => handleClick(n)}
                    className={`flex gap-3 px-4 py-3 transition hover:bg-white/5 cursor-pointer border-l-2 ${
                      n.is_read ? "border-transparent opacity-70" : "border-[var(--neon-gold)]"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.color} text-white shadow-md`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[13px] font-bold text-white truncate">{n.title}</div>
                        <div className="text-[10px] text-white/50 shrink-0">{timeAgo(n.created_at)}</div>
                      </div>
                      {n.body && <div className="mt-0.5 text-[11px] text-white/70 line-clamp-2">{n.body}</div>}
                      {n.is_broadcast && (
                        <div className="mt-1 inline-block rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-fuchsia-300">
                          📢 ব্রডকাস্ট
                        </div>
                      )}
                    </div>
                    {!n.is_read && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--neon-gold)] shadow-[0_0_8px_rgba(255,215,0,0.7)]" />}
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} to={n.link} onClick={() => setOpen(false)} className="block">
                    {Content}
                  </Link>
                ) : (
                  <div key={n.id}>{Content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
