import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { SiteShell } from "@/components/landing/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Copy,
  Crown,
  Wallet as WalletIcon,
  Gift,
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  Gamepad2,
  Sparkles,
  ChevronRight,
  Pencil,
  LogOut,
  History as HistoryIcon,
} from "lucide-react";
import { TxnRow } from "./wallet";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — PKOK" },
      { name: "description", content: "View and edit your profile, wallet balance, VIP tier and referral code." },
    ],
  }),
  component: ProfilePage,
});

const TIER_ORDER = ["bronze", "silver", "gold", "platinum", "diamond"] as const;
const TIER_META: Record<string, { label: string; grad: string; ring: string; glow: string; icon: string }> = {
  bronze:   { label: "BRONZE",   grad: "from-amber-700 via-orange-600 to-yellow-500", ring: "ring-amber-500/40",   glow: "shadow-amber-500/40",   icon: "🥉" },
  silver:   { label: "SILVER",   grad: "from-slate-400 via-slate-300 to-slate-500",   ring: "ring-slate-300/40",   glow: "shadow-slate-300/40",   icon: "🥈" },
  gold:     { label: "GOLD",     grad: "from-yellow-500 via-amber-400 to-yellow-600", ring: "ring-yellow-400/50",  glow: "shadow-yellow-500/40",  icon: "🥇" },
  platinum: { label: "PLATINUM", grad: "from-cyan-400 via-sky-300 to-indigo-400",     ring: "ring-cyan-300/50",    glow: "shadow-cyan-400/40",    icon: "💎" },
  diamond:  { label: "DIAMOND",  grad: "from-fuchsia-400 via-violet-400 to-indigo-500", ring: "ring-fuchsia-400/50", glow: "shadow-fuchsia-500/40", icon: "💠" },
};

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", replace: true });
  }, [authLoading, user, navigate]);

  const [txns, setTxns] = useState<any[]>([]);
  const [stats, setStats] = useState({ deposits: 0, withdraws: 0, wagered: 0, wins: 0, bets: 0, netWin: 0 });
  const [tierConfigs, setTierConfigs] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: t }, { data: v }, { data: allTxns }] = await Promise.all([
        supabase
          .from("transactions")
          .select("id, type, status, amount, txn_reference, admin_note, created_at, approved_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("vip_tier_configs").select("tier, min_deposit_total, cashback_pct, daily_bonus, weekly_bonus").order("min_deposit_total"),
        supabase
          .from("transactions")
          .select("type, status, amount")
          .eq("user_id", user.id)
          .eq("status", "approved"),
      ]);
      setTxns(t ?? []);
      setTierConfigs(v ?? []);
      const s = { deposits: 0, withdraws: 0, wagered: 0, wins: 0, bets: 0, netWin: 0 };
      (allTxns ?? []).forEach((r: any) => {
        const amt = Number(r.amount) || 0;
        if (r.type === "deposit") s.deposits += amt;
        else if (r.type === "withdraw") s.withdraws += amt;
        else if (r.type === "bet") { s.wagered += amt; s.bets += 1; s.netWin -= amt; }
        else if (r.type === "win") { s.wins += amt; s.netWin += amt; }
      });
      setStats(s);
    })();
  }, [user]);

  if (authLoading || !user) {
    return <SiteShell><div className="mx-auto max-w-3xl px-4 py-16 text-center text-white/70">Loading…</div></SiteShell>;
  }

  if (!profile) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white/70 space-y-4">
          {profileLoading ? <div>প্রোফাইল লোড হচ্ছে…</div> : (
            <>
              <div>প্রোফাইল পাওয়া যায়নি।</div>
              <Button onClick={refetch} variant="outline">আবার চেষ্টা করুন</Button>
            </>
          )}
        </div>
      </SiteShell>
    );
  }

  const currentTier = (profile.vip_tier || "bronze").toLowerCase();
  const currentMeta = TIER_META[currentTier] ?? TIER_META.bronze;
  const currentIdx = TIER_ORDER.indexOf(currentTier as any);
  const nextTierKey = TIER_ORDER[currentIdx + 1];
  const currentConf = tierConfigs.find((c) => c.tier === currentTier);
  const nextConf = nextTierKey ? tierConfigs.find((c) => c.tier === nextTierKey) : null;
  const nextThreshold = nextConf ? Number(nextConf.min_deposit_total) : null;
  const currentThreshold = currentConf ? Number(currentConf.min_deposit_total) : 0;
  const progressPct = nextThreshold
    ? Math.min(100, Math.max(0, ((stats.deposits - currentThreshold) / Math.max(1, nextThreshold - currentThreshold)) * 100))
    : 100;
  const remainingToNext = nextThreshold ? Math.max(0, nextThreshold - stats.deposits) : 0;

  const winRate = stats.bets > 0 ? (stats.wins / Math.max(1, stats.wagered)) * 100 : 0;

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <SiteShell>
      <div className="relative mx-auto max-w-5xl px-3 py-6 sm:px-4 space-y-5">
        {/* HERO CARD */}
        <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-7 shadow-2xl ${currentMeta.glow}`}>
          {/* starfield */}
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{
            background: `radial-gradient(1px 1px at 20% 30%, white, transparent),
                         radial-gradient(1px 1px at 70% 60%, white, transparent),
                         radial-gradient(1px 1px at 40% 80%, white, transparent),
                         radial-gradient(1px 1px at 85% 20%, white, transparent),
                         radial-gradient(1px 1px at 10% 70%, white, transparent)`,
          }} />
          <div className={`pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br ${currentMeta.grad} opacity-30 blur-3xl`} />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-20 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${currentMeta.grad} blur-md opacity-60`} />
              <Avatar className={`relative h-24 w-24 ring-4 ${currentMeta.ring} ring-offset-2 ring-offset-slate-900`}>
                <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name ?? "user"} />
                <AvatarFallback className="bg-slate-800 text-2xl text-white">
                  {(profile.display_name || profile.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${currentMeta.grad} text-lg shadow-lg`}>
                {currentMeta.icon}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-white">
                  {profile.display_name || profile.username || "Player"}
                </h1>
                <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${currentMeta.grad} px-2.5 py-0.5 text-[10px] font-black text-white shadow`}>
                  <Crown className="h-3 w-3" /> {currentMeta.label}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-white/50">{user.email || user.phone}</div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xs uppercase tracking-widest text-white/50">Balance</span>
                <span className="text-3xl font-black bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  ৳ {Number(profile.wallet_balance).toLocaleString("en-BD", { maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* VIP Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-white/60">
                  <span>VIP progress</span>
                  {nextTierKey ? (
                    <span>৳{remainingToNext.toLocaleString("en-BD")} → {TIER_META[nextTierKey].label}</span>
                  ) : (
                    <span className="font-bold text-fuchsia-300">MAX TIER 🏆</span>
                  )}
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${nextTierKey ? TIER_META[nextTierKey].grad : currentMeta.grad} shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-row gap-2 sm:flex-col">
              <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
              <Button onClick={logout} variant="ghost" size="sm" className="text-white/60 hover:bg-white/10 hover:text-white">
                <LogOut className="mr-1 h-3.5 w-3.5" /> Logout
              </Button>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction to="/wallet" search={{ tab: "deposit" }} icon={WalletIcon} label="ডিপোজিট" grad="from-emerald-500 to-teal-600" />
          <QuickAction to="/wallet" search={{ tab: "withdraw" }} icon={TrendingDown} label="উত্তোলন" grad="from-blue-500 to-cyan-600" />
          <QuickAction to="/promotions" icon={Gift} label="প্রমো" grad="from-rose-500 to-pink-600" />
          <QuickAction to="/vip" icon={Crown} label="VIP" grad="from-yellow-500 to-amber-600" />
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Deposits" value={`৳${stats.deposits.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`} icon={TrendingUp} tone="emerald" />
          <StatCard label="Total Withdraws" value={`৳${stats.withdraws.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`} icon={TrendingDown} tone="rose" />
          <StatCard label="Total Wagered" value={`৳${stats.wagered.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`} icon={Gamepad2} tone="violet" />
          <StatCard label={stats.netWin >= 0 ? "Net Profit" : "Net Loss"} value={`৳${Math.abs(stats.netWin).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`} icon={Trophy} tone={stats.netWin >= 0 ? "amber" : "slate"} />
        </div>

        {/* REFERRAL + VIP PERKS */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ReferralCard code={profile.referral_code} />
          <VipPerksCard conf={currentConf} tier={currentMeta} winRate={winRate} bets={stats.bets} />
        </div>

        {/* TRANSACTIONS */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black text-white">
              <HistoryIcon className="h-4 w-4 text-violet-400" /> সাম্প্রতিক লেনদেন
            </h2>
            <Link to="/wallet" search={{ tab: "history" }} className="inline-flex items-center gap-0.5 text-xs font-bold text-violet-300 hover:text-violet-200">
              সব দেখুন <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {txns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-white/50">
                কোনো লেনদেন নেই
              </div>
            ) : (
              txns.map((t) => <TxnRow key={t.id} r={t} />)
            )}
          </div>
        </div>
      </div>

      {editing && (
        <EditProfileSheet
          initial={{ display_name: profile.display_name ?? "", phone: profile.phone ?? "", avatar_url: profile.avatar_url ?? "" }}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); refetch(); }}
          userId={user.id}
        />
      )}
    </SiteShell>
  );
}

function QuickAction({ to, search, icon: Icon, label, grad }: any) {
  return (
    <Link
      to={to}
      search={search}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur transition hover:border-white/20 hover:-translate-y-0.5"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-0 transition group-hover:opacity-10`} />
      <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-lg`}>
        <Icon className="h-5 w-5" strokeWidth={2.4} />
      </div>
      <div className="relative mt-2 text-sm font-bold text-white">{label}</div>
    </Link>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  const tones: Record<string, { grad: string; text: string }> = {
    emerald: { grad: "from-emerald-500 to-teal-600", text: "text-emerald-300" },
    rose:    { grad: "from-rose-500 to-pink-600",    text: "text-rose-300" },
    violet:  { grad: "from-violet-500 to-indigo-600",text: "text-violet-300" },
    amber:   { grad: "from-yellow-500 to-amber-600", text: "text-amber-300" },
    slate:   { grad: "from-slate-500 to-slate-700",  text: "text-slate-300" },
  };
  const t = tones[tone] ?? tones.emerald;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur">
      <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${t.grad} opacity-20 blur-2xl`} />
      <div className="relative flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</div>
        <Icon className={`h-3.5 w-3.5 ${t.text}`} />
      </div>
      <div className={`relative mt-2 text-lg font-black ${t.text}`}>{value}</div>
    </div>
  );
}

function ReferralCard({ code }: { code: string }) {
  function copy() {
    navigator.clipboard.writeText(code);
    toast.success("রেফারেল কোড কপি হয়েছে");
  }
  function share() {
    const url = `${window.location.origin}/register?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("রেফারেল লিংক কপি হয়েছে");
  }
  return (
    <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-slate-900 via-violet-950/60 to-slate-900 p-5">
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-fuchsia-300">
            <Users className="h-3.5 w-3.5" /> Refer & Earn
          </div>
          <div className="mt-1 text-sm text-white/60">বন্ধুদের ইনভাইট করে কমিশন জিতুন</div>
        </div>
        <Sparkles className="h-6 w-6 text-fuchsia-400" />
      </div>
      <div className="relative mt-4 flex items-center gap-2">
        <div className="flex-1 rounded-xl border border-fuchsia-400/30 bg-black/40 px-4 py-3 font-mono text-lg font-black tracking-widest text-fuchsia-200">
          {code}
        </div>
        <Button onClick={copy} size="icon" variant="outline" className="border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/20">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <Button onClick={share} className="relative mt-3 w-full bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white">
        Share Invite Link
      </Button>
    </div>
  );
}

function VipPerksCard({ conf, tier, winRate, bets }: any) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5">
      <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${tier.grad} opacity-25 blur-3xl`} />
      <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70">
        <Crown className={`h-3.5 w-3.5`} /> {tier.label} Perks
      </div>
      <div className="relative mt-3 grid grid-cols-3 gap-2">
        <PerkTile label="Daily" value={conf ? `৳${Number(conf.daily_bonus).toFixed(0)}` : "—"} />
        <PerkTile label="Weekly" value={conf ? `৳${Number(conf.weekly_bonus).toFixed(0)}` : "—"} />
        <PerkTile label="Cashback" value={conf ? `${Number(conf.cashback_pct)}%` : "—"} />
      </div>
      <div className="relative mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-white/50">Games Played</div>
          <div className="mt-0.5 text-base font-black text-white">{bets.toLocaleString("en-BD")}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-white/50">Return Rate</div>
          <div className="mt-0.5 text-base font-black text-white">{winRate.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

function PerkTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center">
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
    </div>
  );
}

function EditProfileSheet({ initial, onClose, onSaved, userId }: any) {
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [phone, setPhone] = useState(initial.phone);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("প্রোফাইল আপডেট হয়েছে");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-white">প্রোফাইল সম্পাদনা</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-bold text-white/70">
            Display Name
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" />
          </label>
          <label className="block text-xs font-bold text-white/70">
            Phone
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" />
          </label>
          <label className="block text-xs font-bold text-white/70">
            Avatar URL
            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="mt-1 bg-white/5 border-white/10 text-white" />
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
          </Button>
        </div>
      </div>
    </div>
  );
}
