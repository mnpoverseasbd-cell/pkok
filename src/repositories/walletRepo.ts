import { supabase } from "@/integrations/supabase/client";

export const walletRepo = {
  async getBalance(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return Number(data?.wallet_balance ?? 0);
  },
  async listTransactions(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
