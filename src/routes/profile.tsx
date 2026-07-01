import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile, useIsAdmin } from "@/hooks/useAuth";
import { SiteShell } from "@/components/landing/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Crown, ShieldCheck } from "lucide-react";
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

function ProfilePage() {
  const { user, loading } = useAuth();
  const { profile, refetch } = useProfile(user?.id);
  const { isAdmin } = useIsAdmin(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setPhone(profile.phone ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("transactions")
      .select("id, type, status, amount, txn_reference, admin_note, created_at, approved_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setTxns(data ?? []));
  }, [user]);

  if (!user || !profile) {
    return <SiteShell><div className="mx-auto max-w-3xl px-4 py-16 text-center text-white/80">Loading…</div></SiteShell>;
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null, phone: phone.trim() || null, avatar_url: avatarUrl.trim() || null })
      .eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("প্রোফাইল আপডেট হয়েছে");
    refetch();
  }

  function copyReferral() {
    navigator.clipboard.writeText(profile!.referral_code);
    toast.success("রেফারেল কোড কপি হয়েছে");
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl space-y-4 px-3 py-6 sm:px-4">
        <Card className="border-[var(--neon-green)]/40 bg-black/50">
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <Avatar className="h-16 w-16 border-2 border-[var(--neon-gold)]">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name ?? "user"} />
              <AvatarFallback>{(profile.display_name || profile.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-lg font-black text-white">
                {profile.display_name || profile.username || "User"}
                {isAdmin && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300"><ShieldCheck className="h-3 w-3" />Admin</span>}
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neon-gold)]/20 px-2 py-0.5 text-xs text-[var(--neon-gold)]"><Crown className="h-3 w-3" />{profile.vip_tier}</span>
              </div>
              <div className="text-xs text-white/70">{user.email}</div>
              <div className="mt-1 text-2xl font-black text-[var(--neon-green)]">৳ {Number(profile.wallet_balance).toFixed(2)}</div>
            </div>
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate({ to: "/admin" })}>Admin Panel</Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40">
          <CardHeader><CardTitle className="text-white">রেফারেল কোড</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-md border border-[var(--neon-gold)]/50 bg-black/50 px-4 py-2 font-mono text-xl font-black tracking-widest text-[var(--neon-gold)]">
              {profile.referral_code}
            </div>
            <Button onClick={copyReferral} variant="outline" size="sm"><Copy className="h-4 w-4" /> Copy</Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40">
          <CardHeader><CardTitle className="text-white">প্রোফাইল সম্পাদনা</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><label className="text-xs text-white/70">Display Name</label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
            <div><label className="text-xs text-white/70">Phone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="text-xs text-white/70">Avatar URL</label><Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." /></div>
            <div className="sm:col-span-2"><Button onClick={save} disabled={saving} className="w-full bg-green-button font-bold text-[var(--background)]">{saving ? "সেভ হচ্ছে…" : "সেভ"}</Button></div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40">
          <CardHeader><CardTitle className="text-white">সাম্প্রতিক লেনদেন</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {txns.length === 0 ? <div className="text-sm text-white/60">কোনো লেনদেন নেই</div>
              : txns.map((t) => <TxnRow key={t.id} r={t} />)}
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
