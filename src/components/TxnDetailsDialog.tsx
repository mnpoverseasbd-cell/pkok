import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminSupabase } from "@/lib/admin-supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Clock, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export type TxnDetailRow = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  amount: number;
  txn_reference: string | null;
  sender_account: string | null;
  receiver_account: string | null;
  user_note: string | null;
  admin_note: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  payment_method_id: string | null;
  payment_methods?: { label: string; kind: string; account_number: string } | null;
  profiles?: { display_name: string | null; username: string | null; email: string | null; phone: string | null } | null;
};

export function TxnDetailsDialog({
  txnId,
  open,
  onOpenChange,
  showUser = false,
}: {
  txnId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  showUser?: boolean;
}) {
  const [row, setRow] = useState<TxnDetailRow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !txnId) return;
    setLoading(true);
    setRow(null);
    (async () => {
      const withUser = "id, user_id, type, status, amount, txn_reference, sender_account, receiver_account, user_note, admin_note, created_at, approved_at, approved_by, payment_method_id, payment_methods(label, kind, account_number), profiles!transactions_user_id_fkey(display_name, username, email, phone)";
      const noUser = "id, user_id, type, status, amount, txn_reference, sender_account, receiver_account, user_note, admin_note, created_at, approved_at, approved_by, payment_method_id, payment_methods(label, kind, account_number)";
      const client = showUser ? adminSupabase : supabase;
      const { data, error } = await client.from("transactions").select(showUser ? withUser : noUser).eq("id", txnId).maybeSingle();
      if (error) {
        const fb = await client.from("transactions").select("*").eq("id", txnId).maybeSingle();
        setRow(fb.data as TxnDetailRow | null);
      } else setRow(data as unknown as TxnDetailRow);
      setLoading(false);
    })();
  }, [open, txnId, showUser]);

  const status = row?.status ?? "";
  const StatusIcon = status === "approved" ? CheckCircle2 : (status === "rejected" || status === "cancelled") ? XCircle : Clock;
  const statusColor = status === "approved" ? "text-[var(--neon-green)]" : (status === "rejected" || status === "cancelled") ? "text-red-400" : "text-[var(--neon-gold)]";
  const sign = row?.type === "withdraw" ? "-" : "+";

  function copy(text: string | null | undefined) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#111] border-[var(--neon-green)]/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
            <span className="capitalize">{row?.type ?? "Transaction"} details</span>
          </DialogTitle>
        </DialogHeader>

        {loading || !row ? (
          <div className="p-6 text-center text-white/60">Loading…</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="rounded-md border border-white/10 bg-black/40 p-3 text-center">
              <div className="text-xs uppercase text-white/50">পরিমাণ</div>
              <div className={`text-3xl font-black ${row.type === "withdraw" ? "text-red-300" : "text-[var(--neon-green)]"}`}>
                {sign}৳{Number(row.amount).toFixed(2)}
              </div>
              <div className={`text-xs uppercase font-bold ${statusColor}`}>{row.status}</div>
            </div>

            {showUser && row.profiles && (
              <Field label="User">
                <div className="font-bold text-white">{row.profiles.display_name || row.profiles.username || "—"}</div>
                <div className="text-xs text-white/60">{row.profiles.phone || row.profiles.email}</div>
              </Field>
            )}

            {row.payment_methods && (
              <Field label="Payment Method">
                <div className="font-bold text-white">{row.payment_methods.label} <span className="text-xs uppercase text-white/50">({row.payment_methods.kind})</span></div>
                <CopyRow value={row.payment_methods.account_number} onCopy={() => copy(row.payment_methods?.account_number)} />
              </Field>
            )}

            {row.txn_reference && (
              <Field label="Transaction ID">
                <CopyRow value={row.txn_reference} onCopy={() => copy(row.txn_reference)} />
              </Field>
            )}

            {row.sender_account && (
              <Field label="Sender Account">
                <CopyRow value={row.sender_account} onCopy={() => copy(row.sender_account)} />
              </Field>
            )}

            {row.receiver_account && (
              <Field label="Receiver Account">
                <CopyRow value={row.receiver_account} onCopy={() => copy(row.receiver_account)} />
              </Field>
            )}

            {row.user_note && (
              <Field label="User Note"><div className="text-white/90">{row.user_note}</div></Field>
            )}

            {row.admin_note && (
              <Field label="Admin Note"><div className="text-white/90">{row.admin_note}</div></Field>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <Field label="Requested">
                <div className="text-white/80">{new Date(row.created_at).toLocaleString()}</div>
              </Field>
              {row.approved_at && (
                <Field label={row.status === "approved" ? "Approved" : "Processed"}>
                  <div className="text-white/80">{new Date(row.approved_at).toLocaleString()}</div>
                </Field>
              )}
            </div>

            <div className="pt-1 text-[10px] text-white/40 font-mono break-all">ID: {row.id}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-2">
      <div className="text-[10px] uppercase text-white/50">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function CopyRow({ value, onCopy }: { value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-sm text-white/90 break-all">{value}</span>
      <button onClick={onCopy} className="shrink-0 rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
    </div>
  );
}
