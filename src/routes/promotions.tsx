import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteShell } from "@/components/landing/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Sparkles, Trophy, Loader2 } from "lucide-react";
import { claimPromoCode } from "@/lib/promotions.functions";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions — PKOK" },
      { name: "description", content: "Active bonuses, promo codes, and cashback offers." },
    ],
  }),
  component: PromotionsPage,
});

type Promo = {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  type: "deposit_bonus" | "free_credit" | "cashback";
  bonus_pct: number;
  bonus_fixed: number;
  min_deposit: number;
  max_bonus: number;
  wagering_multiplier: number;
};

type Claim = {
  id: string;
  promotion_id: string;
  granted_amount: number;
  wagering_required: number;
  wagering_progress: number;
  status: string;
  created_at: string;
  promotions: { name: string; code: string | null; type: string } | null;
};

function PromotionsPage() {
  const { user } = useAuth();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .order("created_at", { ascending: false });
    setPromos((data ?? []) as any);
    if (user) {
      const { data: c } = await supabase
        .from("user_promotions")
        .select("id,promotion_id,granted_amount,wagering_required,wagering_progress,status,created_at,promotions(name,code,type)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setClaims((c ?? []) as any);
    } else {
      setClaims([]);
    }
    setLoading(false);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("লগইন করুন");
      return;
    }
    if (!code.trim()) return;
    setClaiming(true);
    try {
      const res: any = await claimPromoCode({ data: { code: code.trim() } });
      if (res?.success) {
        toast.success(res.message || "Promo claimed!");
        setCode("");
        load();
      } else {
        toast.error(res?.message || "Could not claim");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Promotions</h1>
            <p className="text-sm text-muted-foreground">Bonus, cashback & promo codes</p>
          </div>
        </header>

        <form onSubmit={submitCode} className="flex gap-2 rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="PROMO CODE লিখুন"
            className="uppercase font-bold tracking-wider"
          />
          <Button type="submit" disabled={claiming || !code.trim()} className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
            {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-1 h-4 w-4" /> Claim</>}
          </Button>
        </form>

        <section>
          <h2 className="mb-3 text-lg font-black">Active Offers</h2>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : promos.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card/40 p-8 text-center text-sm text-muted-foreground">
              এই মুহূর্তে কোনো অফার নেই
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {promos.map((p) => (
                <div key={p.id} className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-rose-500/5 p-5 shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-widest text-rose-500">{p.type.replace("_", " ")}</div>
                  <div className="mt-1 text-lg font-black">{p.name}</div>
                  {p.description && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</div>}
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                      {p.type === "free_credit" ? `৳${p.bonus_fixed}` : `${p.bonus_pct}%`}
                    </span>
                    {p.max_bonus > 0 && p.type !== "free_credit" && (
                      <span className="text-xs text-muted-foreground">up to ৳{p.max_bonus}</span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    {p.min_deposit > 0 && <div>Min deposit: ৳{p.min_deposit}</div>}
                    {p.wagering_multiplier > 0 && <div>Wagering: {p.wagering_multiplier}× bonus</div>}
                  </div>
                  {p.code && (
                    <button
                      onClick={() => { setCode(p.code!); toast.info(`Code copied: ${p.code}`); }}
                      className="mt-4 w-full rounded-lg border border-dashed border-rose-400/60 bg-rose-500/10 py-2 text-xs font-black tracking-widest text-rose-600 hover:bg-rose-500/20"
                    >
                      {p.code}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {user && claims.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-black flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Your Bonuses
            </h2>
            <div className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden">
              {claims.map((c) => {
                const pct = c.wagering_required > 0
                  ? Math.min(100, (c.wagering_progress / c.wagering_required) * 100)
                  : 100;
                return (
                  <div key={c.id} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{c.promotions?.name || "Bonus"}</div>
                      <div className="text-xs text-muted-foreground">
                        ৳{Number(c.granted_amount).toLocaleString("en-BD")} • Wager {Number(c.wagering_progress).toFixed(0)}/{Number(c.wagering_required).toFixed(0)}
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/40">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      c.status === "completed" ? "bg-emerald-500/20 text-emerald-600" :
                      c.status === "active" ? "bg-blue-500/20 text-blue-600" :
                      "bg-slate-500/20 text-slate-500"
                    }`}>{c.status}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
