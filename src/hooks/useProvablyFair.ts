import { useCallback, useEffect, useState } from "react";
import { randomSeed, sha256Hex } from "@/lib/provablyFair";

export type PastBet = {
  nonce: number;
  serverSeedHash: string; // hash of the seed in use at the time
  clientSeed: string;
  outcome: string; // human-readable, e.g. "roll=42.31" or "crash=2.14×"
};

type PfState = {
  clientSeed: string;
  serverSeed: string;      // current active (still hashed publicly)
  serverSeedHash: string;
  nonce: number;
  nextServerSeed: string;  // pre-committed, revealed after rotation
  nextServerSeedHash: string;
  history: PastBet[];
};

const KEY = (gameKey: string) => `pf:${gameKey}`;
const HIST_LIMIT = 20;

async function createFreshState(): Promise<PfState> {
  const serverSeed = randomSeed();
  const nextServerSeed = randomSeed();
  const [serverSeedHash, nextServerSeedHash] = await Promise.all([
    sha256Hex(serverSeed),
    sha256Hex(nextServerSeed),
  ]);
  return {
    clientSeed: randomSeed(8),
    serverSeed,
    serverSeedHash,
    nonce: 0,
    nextServerSeed,
    nextServerSeedHash,
    history: [],
  };
}

export function useProvablyFair(gameKey: string) {
  const [state, setState] = useState<PfState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY(gameKey)) : null;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as PfState;
          if (!cancelled) setState(parsed);
          return;
        } catch { /* fall through */ }
      }
      const fresh = await createFreshState();
      if (!cancelled) {
        setState(fresh);
        localStorage.setItem(KEY(gameKey), JSON.stringify(fresh));
      }
    })();
    return () => { cancelled = true; };
  }, [gameKey]);

  const persist = useCallback((s: PfState) => {
    localStorage.setItem(KEY(gameKey), JSON.stringify(s));
    setState(s);
  }, [gameKey]);

  /** Consume the next nonce and record the outcome. Returns the nonce used. */
  const consume = useCallback((outcome: string): number => {
    if (!state) return 0;
    const nonce = state.nonce;
    const bet: PastBet = {
      nonce,
      serverSeedHash: state.serverSeedHash,
      clientSeed: state.clientSeed,
      outcome,
    };
    const next: PfState = {
      ...state,
      nonce: nonce + 1,
      history: [bet, ...state.history].slice(0, HIST_LIMIT),
    };
    persist(next);
    return nonce;
  }, [state, persist]);

  const setClientSeed = useCallback((clientSeed: string) => {
    if (!state) return;
    persist({ ...state, clientSeed: clientSeed.trim() || randomSeed(8), nonce: 0 });
  }, [state, persist]);

  /** Reveal current server seed, promote next → current, mint a new next. */
  const rotateServerSeed = useCallback(async () => {
    if (!state) return null;
    const revealed = state.serverSeed;
    const revealedHash = state.serverSeedHash;
    const newNextServerSeed = randomSeed();
    const newNextServerSeedHash = await sha256Hex(newNextServerSeed);
    persist({
      ...state,
      serverSeed: state.nextServerSeed,
      serverSeedHash: state.nextServerSeedHash,
      nextServerSeed: newNextServerSeed,
      nextServerSeedHash: newNextServerSeedHash,
      nonce: 0,
      history: [],
    });
    return { revealedSeed: revealed, revealedHash };
  }, [state, persist]);

  return {
    ready: !!state,
    clientSeed: state?.clientSeed ?? "",
    serverSeed: state?.serverSeed ?? "",
    serverSeedHash: state?.serverSeedHash ?? "",
    nonce: state?.nonce ?? 0,
    nextServerSeedHash: state?.nextServerSeedHash ?? "",
    history: state?.history ?? [],
    consume,
    setClientSeed,
    rotateServerSeed,
  };
}
