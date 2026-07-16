import { useCallback, useEffect, useState } from "react";

const KEY = "asik_demo_wallet_v1";
const START = 1000;

function read(): number {
  if (typeof window === "undefined") return START;
  const v = window.localStorage.getItem(KEY);
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : START;
}

function write(v: number) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, String(v));
  window.dispatchEvent(new CustomEvent("demo-wallet-change"));
}

export function useDemoWallet() {
  const [balance, setBalance] = useState<number>(START);

  useEffect(() => {
    setBalance(read());
    const on = () => setBalance(read());
    window.addEventListener("demo-wallet-change", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("demo-wallet-change", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const bet = useCallback((amount: number) => {
    const cur = read();
    if (amount <= 0 || amount > cur) return false;
    write(cur - amount);
    return true;
  }, []);

  const credit = useCallback((amount: number) => {
    if (amount <= 0) return;
    write(read() + amount);
  }, []);

  const reset = useCallback(() => write(START), []);

  return { balance, bet, credit, reset };
}
