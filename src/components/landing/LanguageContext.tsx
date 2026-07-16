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

  // Ticker
  tickerLuckyRed: { BN: "🧧 লাকি রেড খাম পেতে প্রতিদিন লগ ইন করুন", EN: "🧧 Log in daily to grab your lucky red envelope" },
  tickerDailyTourney: { BN: "🏆 ডেইলি টুর্নামেন্ট পুরোদমে চলছে", EN: "🏆 Daily tournaments are running in full swing" },
  tickerVip: { BN: "👑 VIP এক্সক্লুসিভ সুবিধা", EN: "👑 VIP exclusive benefits" },
  tickerBonus: { BN: "🎁 নতুন সদস্যদের জন্য ১৭৭৭ টাকা বোনাস", EN: "🎁 ৳1,777 bonus for new members" },
  tickerFastDW: { BN: "💰 তাৎক্ষণিক ডিপোজিট ও উত্তোলন", EN: "💰 Instant deposits & withdrawals" },

  // Promo card titles
  promoWelcome: { BN: "৯৫০% স্বাগতম অফার", EN: "950% Welcome Offer" },
  promoDaily: { BN: "দৈনিক ফ্রি রিওয়ার্ড", EN: "Daily Free Rewards" },
  promoVipCashback: { BN: "বিশেষ VIP ক্যাশব্যাক", EN: "Exclusive VIP Cashback" },

  // Main categories
  catSlots: { BN: "স্লট", EN: "Slots" },
  catFish: { BN: "ফিশিং", EN: "Fishing" },
  catLive: { BN: "লাইভ", EN: "Live" },
  catPoker: { BN: "পোকার", EN: "Poker" },

  // App section
  appTagline: { BN: "সেরা অভিজ্ঞতা", EN: "Best Experience" },
  appDescription: {
    BN: "বিশ্বের সেরা সমৃদ্ধ বিনোদনমূলক মোবাইল অ্যাপ, যা মূলত এবং নিখুঁত ব্যবহারকারীর অভিজ্ঞতা প্রদান করে। সুপার স্লট গেম, শীর্ষ ই-স্পোর্টস ইভেন্ট, লাইভ ডিলার, ম্যাচ, লটারি এবং মেঘা-কার্নিভাল সেবা এবং আপনার বাংলা মুহূর্তে সবচেয়ে পূর্ণাঙ্গ বিনোদন উপভোগে কনভাল এবং QR কোড স্ক্যান করে ডাউনলোড করুন।",
    EN: "The world's richest entertainment mobile app delivering a truly seamless user experience. Enjoy super slot games, top e-sports events, live dealers, matches, lottery and mega-carnival services. Scan the QR code to download now.",
  },

  // Service stats
  serviceQualityTitle: { BN: "উচ্চমানের পরিষেবা", EN: "Premium Service" },
  statAvgDeposit: { BN: "গড় জমা দেওয়ার সময়", EN: "Avg. Deposit Time" },
  statPaymentPartners: { BN: "পেমেন্ট প্ল্যাটফর্ম পার্টনার", EN: "Payment Partners" },
  statAvgWithdraw: { BN: "গড় উত্তোলনের সময়", EN: "Avg. Withdrawal Time" },
  statGameProviders: { BN: "গেমিং প্রদানকারী পার্টনার", EN: "Gaming Providers" },

  // Feature cards
  featFastTitle: { BN: "দ্রুত জমা ও উত্তোলন", EN: "Fast Deposits & Withdrawals" },
  featFastBody: {
    BN: "আমাদের সর্বশেষ পেমেন্ট গেটওয়ে প্রযুক্তি এক্সক্লুসিভ নেটওয়ার্ক অপ্টিমাইজেশনের মাধ্যমে অত্যন্ত দ্রুত জমা, উত্তোলন এবং স্থানান্তর অর্জন করে, যা আপনাকে একটি প্রথম শ্রেণির গেমিং অভিজ্ঞতা প্রদান করে।",
    EN: "Our latest payment gateway technology combined with exclusive network optimization delivers ultra-fast deposits, withdrawals and transfers — giving you a first-class gaming experience.",
  },
  featSecureTitle: { BN: "নিরাপদ লেনদেন ও সম্পূর্ণ সুরক্ষা নিশ্চিত", EN: "Secure Transactions & Full Protection" },
  featSecureBody: {
    BN: "আমরা ব্যবহার করছি ১২৮-বিট এনক্রিপশন প্রযুক্তি—বিশ্বস্ত ও আন্তর্জাতিকভাবে স্বীকৃত সুরক্ষা মান। আমাদের নিরাপত্তা ব্যবস্থাপনা প্রতিটি লেনদেনকে সম্পূর্ণ সুরক্ষিত রাখে।",
    EN: "We use 128-bit encryption — a trusted, internationally recognized security standard. Our security infrastructure keeps every transaction fully protected.",
  },
  featGamesTitle: { BN: "রোমাঞ্চকর গেম সমাহার", EN: "Thrilling Game Collection" },
  featGamesBody: {
    BN: "আমরা সম্পূর্ণ সেটআপসহ অ্যাপ্লিকেশন সরবরাহ করি, যাতে সদস্যরা যেকোনো সময়, যেকোনো স্থান থেকে ওয়েব, H5 ও ডেডিকেটেড অ্যাপ্লিকেশন মাধ্যমে গেম উপভোগ করতে পারেন। আমাদের ২৪x৭ অনলাইন কাস্টমার সার্ভিস সর্বোচ্চ মানের ও আন্তরিক সেবা প্রদান করে।",
    EN: "We provide a complete application suite so members can enjoy games anytime, anywhere via web, H5 and dedicated apps. Our 24×7 online customer service delivers top-quality, sincere support.",
  },
  featDevicesTitle: { BN: "একাধিক অ্যাপ্লিকেশন বিকল্প", EN: "Multiple App Options" },
  featDevicesBody: {
    BN: "আমরা সম্পূর্ণ সেট অ্যাপ্লিকেশন সরবরাহ করি, যা সদস্যদের ওয়েব, H5 এবং নেটিভ অ্যাপের মাধ্যমে যেকোনো সময়, যেকোনো স্থানে গেম উপভোগ করতে সক্ষম করে। আমাদের ২৪x৭ অনলাইন কাস্টমার সার্ভিস সবচেয়ে আন্তরিক ও উচ্চমানের সেবা প্রদান করে।",
    EN: "We provide a full application suite enabling members to enjoy games anytime, anywhere via web, H5 and native apps. Our 24×7 online customer service offers the most sincere, high-quality support.",
  },

  // Popup
  popupNext: { BN: "পরবর্তী →", EN: "Next →" },
  popupClose: { BN: "বন্ধ করুন", EN: "Close" },
  popupHideToday: { BN: "আজকের জন্য আর দেখাবেন না", EN: "Don't show again today" },

  // Winners feed
  justWonIn: { BN: "সদ্য জিতেছেন", EN: "Just won in" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
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
  const t = (key: string) => translations[key]?.[lang] ?? translations[key]?.BN ?? key;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
