import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "BN" | "EN";

type Dict = Record<string, { BN: string; EN: string }>;

export const translations: Dict = {
  language: { BN: "বাংলা", EN: "English" },
  deposit: { BN: "ডিপোজিট", EN: "Deposit" },
  withdraw: { BN: "উত্তোলন", EN: "Withdraw" },
  login: { BN: "লগইন", EN: "Login" },
  register: { BN: "রেজিস্টার", EN: "Register" },
  mobilePlaceholder: { BN: "মোবাইল নাম্বার", EN: "Mobile Number" },
  passwordPlaceholder: { BN: "পাসওয়ার্ড", EN: "Password" },
  navHome: { BN: "হোম", EN: "Home" },
  navHot: { BN: "গরম", EN: "Hot" },
  navSlots: { BN: "স্লট", EN: "Slots" },
  navFish: { BN: "ফিশিং", EN: "Fishing" },
  navLive: { BN: "লাইভ", EN: "Live" },
  navSports: { BN: "স্পোর্টস", EN: "Sports" },
  navEsports: { BN: "ই-স্পোর্টস", EN: "E-Sports" },
  navPoker: { BN: "পোকার", EN: "Poker" },
  navLottery: { BN: "লটারি", EN: "Lottery" },
  navApp: { BN: "APP", EN: "APP" },
  navPromo: { BN: "প্রমোশন", EN: "Promotions" },
  hotGames: { BN: "গরম গেম", EN: "Hot Games" },
  latestWinners: { BN: "সাম্প্রতিক বিজয়ী", EN: "Latest Winners" },
  more: { BN: "আরও", EN: "More" },
  promo: { BN: "প্রমোশন", EN: "Promotions" },
  footerCopy: {
    BN: "কপিরাইট © 2026 PKOK gaming. সমস্ত অধিকার সংরক্ষিত।",
    EN: "Copyright © 2026 PKOK gaming. All rights reserved.",
  },
  footerAbout: {
    BN: "স্লট গেম সম্পর্কিত PKOK ক্যাসিনো সবচেয়ে জনপ্রিয় গেম ধরনের একটি এবং PKOK এ আছে সেরা স্লট গেম প্রোভাইডার।",
    EN: "PKOK Casino offers the most popular slot games with top-tier providers, delivering an exciting and secure gaming experience across a diverse range of themes and features.",
  },
  mgaCert: { BN: "মাল্টিজ লাইসেন্স (MGA) সার্টিফিকেশন", EN: "Maltese license (MGA) certification" },
  bviCert: { BN: "ব্রিটিশ ভার্জিন আইল্যান্ডস (BVI) সার্টিফিকেশন", EN: "British Virgin Islands (BVI) certification" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof translations) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("BN");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pkok_lang");
      if (saved === "BN" || saved === "EN") setLangState(saved);
    } catch {}
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("pkok_lang", l); } catch {}
  };
  const t = (key: keyof typeof translations) => translations[key][lang];
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
