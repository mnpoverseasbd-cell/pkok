export type HotCatalogGame = {
  i: number;
  title: string;
  provider: string;
  img: string;
  to?: "/games/super-ace" | "/games/crash" | "/games/fortune-gems-2";
};

export const VENDOR_LOGO_WHITE = (provider: string) =>
  `https://images.23924894.com/TCG_PROD_IMAGES/RNG_LIST_VENDOR/${provider}-WHITE.png`;

// Live-only casino providers (Play button only on hover, no Free Trial link)
export const LIVE_ONLY_PROVIDERS = new Set(["EG4", "SEX", "EVO", "AG", "WM"]);

export const HOT_296_GAMES: HotCatalogGame[] = [
    {
        "i":  0,
        "title":  "সুপার এইস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/JL/BN/JL0033.png?_1781943712730",
        "to":  "/games/super-ace"
    },
    {
        "i":  1,
        "title":  "এভিয়েটর",
        "provider":  "SPB",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/SPB/BN/SPB002.png?_1781943840945",
        "to":  "/games/crash"
    },
    {
        "i":  2,
        "title":  "অলিম্পাস প্রতিদ্বন্দ্বী",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG117.avif?t=1795721421000"
    },
    {
        "i":  3,
        "title":  "ফরচুন জেমস ২",
        "provider":  "JL",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/JL/BN/JL0125.webp?_1781944103405",
        "to":  "/games/fortune-gems-2"
    },
    {
        "i":  4,
        "title":  "বক্সিং কিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/JL/BN/JL0038.webp?_1781944315751"
    },
    {
        "i":  5,
        "title":  "ফরচুন জেমস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/JL/BN/JL0045.png?_1781944679386"
    },
    {
        "i":  6,
        "title":  "মানি কামিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0036.avif?t=1795721437000"
    },
    {
        "i":  7,
        "title":  "ফরচুন কয়েনস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0211.avif?t=1795721437000"
    },
    {
        "i":  8,
        "title":  "বন্য বাউন্টি শোডাউন",
        "provider":  "PG",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/PG/BN/PG0113.png?_1781944523930"
    },
    {
        "i":  9,
        "title":  "সুপার এলিমেন্টস",
        "provider":  "FC",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/FC/BN/FC0045.png?_1781944995783"
    },
    {
        "i":  10,
        "title":  "ম্যাজিক এস WILD LOCK",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/JDB/BN/JDB225.webp?_1781945326027"
    },
    {
        "i":  11,
        "title":  "ক্রেজি টাইম",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4147.png?t=1795764484545"
    },
    {
        "i":  12,
        "title":  "ফরচুন জেমস ৩",
        "provider":  "JL",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/JL/BN/JL0156.webp?_1781946026517"
    },
    {
        "i":  13,
        "title":  "সুপার এইস ডিলাক্স",
        "provider":  "JL",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/JL/BN/JL0162.webp?_1781946086115"
    },
    {
        "i":  14,
        "title":  "ক্রেজি৭৭৭",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0021.avif?t=1795721437000"
    },
    {
        "i":  15,
        "title":  "আজটেক ধন",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0066.avif?t=1795721446000"
    },
    {
        "i":  16,
        "title":  "মজাদার সময়",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4326.png?t=1795763677018"
    },
    {
        "i":  17,
        "title":  "লাকি জাগুয়ার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0189.avif?t=1795721437000"
    },
    {
        "i":  18,
        "title":  "কয়েন আপ: হট ফায়ার",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG084.avif?t=1795721424000"
    },
    {
        "i":  19,
        "title":  "ক্রিকেট",
        "provider":  "U9W",
        "img":  "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc/U9W/BN/U9W004.webp?_1776688307038"
    },
    {
        "i":  20,
        "title":  "777 কয়েন",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG074.avif?t=1795721424000"
    },
    {
        "i":  21,
        "title":  "সুপার এইস II",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0214.avif?t=1795721437000"
    },
    {
        "i":  22,
        "title":  "নক্ষত্রমণ্ডল ফলের অধিপতি",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB189.avif?t=1795721437000"
    },
    {
        "i":  23,
        "title":  "বন্য ব্যাণ্ডিটো",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0083.avif?t=1795721445000"
    },
    {
        "i":  24,
        "title":  "৭৭৭-ক্লাসিক স্টাইল",
        "provider":  "BT",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BT/EN/BT0085.avif?t=1795721424000"
    },
    {
        "i":  25,
        "title":  "সুপার এস জোকার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0212.avif?t=1795721437000"
    },
    {
        "i":  26,
        "title":  "মানি কামিং 2",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0215.avif?t=1795721437000"
    },
    {
        "i":  27,
        "title":  "৩ কয়েন আগ্নেয়গিরি",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG107.avif?t=1795721424000"
    },
    {
        "i":  28,
        "title":  "গোল্ডেন এম্পায়ার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0044.avif?t=1795721437000"
    },
    {
        "i":  29,
        "title":  "কয়েন ট্রি",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0202.avif?t=1795721437000"
    },
    {
        "i":  30,
        "title":  "জিলি ক্যাইশেন",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0083.avif?t=1795721437000"
    },
    {
        "i":  31,
        "title":  "ফরচুন কিং জ্যাকপট",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0183.avif?t=1795721437000"
    },
    {
        "i":  32,
        "title":  "১০ ঝলমলে মুকুট",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0217.avif?t=1795721437000"
    },
    {
        "i":  33,
        "title":  "আনুবিস",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0146.avif?t=1795721445000"
    },
    {
        "i":  34,
        "title":  "ফরচুন র্যাবিট",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0120.avif?t=1795721445000"
    },
    {
        "i":  35,
        "title":  "সুপার এস স্ক্র্যাচ",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0168.avif?t=1795721437000"
    },
    {
        "i":  36,
        "title":  "আলি বাবা",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0094.avif?t=1795721437000"
    },
    {
        "i":  37,
        "title":  "মানি পট",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0182.avif?t=1795721437000"
    },
    {
        "i":  38,
        "title":  "৩টি তেড়ে যাওয়া মহিষ",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0213.avif?t=1795721437000"
    },
    {
        "i":  39,
        "title":  "লিগেসি অফ ইজিপ্ট",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0166.avif?t=1795721437000"
    },
    {
        "i":  40,
        "title":  "মাইনস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0110.avif?t=1795721437000"
    },
    {
        "i":  41,
        "title":  "পোকার কিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0066.avif?t=1795721437000"
    },
    {
        "i":  42,
        "title":  "ক্লাসিক ব্যাকারেট",
        "provider":  "SEX",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/SEX/EN/SEX002.avif?t=1795721453000"
    },
    {
        "i":  43,
        "title":  "মানি কামিং এক্সপ্যান্ড বেটস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0167.avif?t=1795721437000"
    },
    {
        "i":  44,
        "title":  "পিগি ব্যাংক",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB223.avif?t=1795721437000"
    },
    {
        "i":  45,
        "title":  "ডায়মন্ড পার্টি",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0200.avif?t=1795721437000"
    },
    {
        "i":  46,
        "title":  "জ্যাকপট জোকার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0153.avif?t=1795721437000"
    },
    {
        "i":  47,
        "title":  "মেগা এস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0093.avif?t=1795721437000"
    },
    {
        "i":  48,
        "title":  "শক্তিশালী সূর্য",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG115.avif?t=1795721424000"
    },
    {
        "i":  49,
        "title":  "৩ হট চিলি",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG075.avif?t=1795721424000"
    },
    {
        "i":  50,
        "title":  "লাকি নেকো",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0073.avif?t=1795721446000"
    },
    {
        "i":  51,
        "title":  "ওয়াইল্ড এস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0116.avif?t=1795721437000"
    },
    {
        "i":  52,
        "title":  "ফরচুন ড্রাগন",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0140.avif?t=1795721445000"
    },
    {
        "i":  53,
        "title":  "৩ চায়না পটস",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG087.avif?t=1795721424000"
    },
    {
        "i":  54,
        "title":  "Lucky Ace",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0123.avif?t=1795721449000"
    },
    {
        "i":  55,
        "title":  "লাকি পেনি",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG098.avif?t=1795721424000"
    },
    {
        "i":  56,
        "title":  "First Person Roulette",
        "provider":  "FP",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FP/EN/FP0027.avif?t=1795721433000"
    },
    {
        "i":  57,
        "title":  "পার্টি নাইট",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0098.avif?t=1795721437000"
    },
    {
        "i":  58,
        "title":  "জ্বলন্ত মুকুট ডিলাক্স",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG094.avif?t=1795721421000"
    },
    {
        "i":  59,
        "title":  "Super Win",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0081.avif?t=1795721449000"
    },
    {
        "i":  60,
        "title":  "Asgardian Rising",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0118.avif?t=1795721445000"
    },
    {
        "i":  61,
        "title":  "মিশরের ৩টি পাত্র",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG105.avif?t=1795721424000"
    },
    {
        "i":  62,
        "title":  "Fiery Sevens Exclusive",
        "provider":  "SG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/SG/EN/SG0134.avif?t=1795721453000"
    },
    {
        "i":  63,
        "title":  "পাগলাটে টাকা",
        "provider":  "YB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/YB/EN/YB0043.avif?t=1795721458000"
    },
    {
        "i":  64,
        "title":  "ক্র্যাশ ক্রিকেট",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0170.avif?t=1795721437000"
    },
    {
        "i":  65,
        "title":  "Crazy Time A",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4148.png?t=1795757375465"
    },
    {
        "i":  66,
        "title":  "মাইনস",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB199.avif?t=1795721437000"
    },
    {
        "i":  67,
        "title":  "গোল্ডেন জিনি",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0038.avif?t=1795721432000"
    },
    {
        "i":  68,
        "title":  "Mahjong Ways",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0046.avif?t=1795721445000"
    },
    {
        "i":  69,
        "title":  "ওশান কিং জ্যাকপট",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0136.avif?t=1795721437000"
    },
    {
        "i":  70,
        "title":  "পসাইডন",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0176.avif?t=1795721437000"
    },
    {
        "i":  71,
        "title":  "চার্জ বাফেলো অ্যাসেন্ট",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0148.avif?t=1795721437000"
    },
    {
        "i":  72,
        "title":  "পিনাটা জয়",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0144.avif?t=1795721445000"
    },
    {
        "i":  73,
        "title":  "রয়েল হান্টার",
        "provider":  "YB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/YB/EN/YB0045.avif?t=1795721458000"
    },
    {
        "i":  74,
        "title":  "বজ্রপাতের ঝড়",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4450.png?t=1795761890966"
    },
    {
        "i":  75,
        "title":  "সুপার হট চিলি",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG094.avif?t=1795721424000"
    },
    {
        "i":  76,
        "title":  "ইজিপ্টস গ্লো",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0174.avif?t=1795721437000"
    },
    {
        "i":  77,
        "title":  "ক্যাশ ঝলকানি",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0508.avif?t=1795721441000"
    },
    {
        "i":  78,
        "title":  "Fiery Sevens",
        "provider":  "SG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/SG/EN/SG0018.webp?t=1795721453000"
    },
    {
        "i":  79,
        "title":  "গোল্ডেন ব্যাংক ২",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0192.avif?t=1795721437000"
    },
    {
        "i":  80,
        "title":  "ফল এবং মুদ্রা",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG087.webp?t=1795721421000"
    },
    {
        "i":  81,
        "title":  "ফ্রুটি বনাঞ্জা কম্বো",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB228.avif?t=1795721437000"
    },
    {
        "i":  82,
        "title":  "পাগলা বল",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4518.png?t=1795758283837"
    },
    {
        "i":  83,
        "title":  "বাবল বিউটি",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0022.webp?t=1795721437000"
    },
    {
        "i":  84,
        "title":  "জ্যাকপট ফিশিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0005.avif?t=1795721437000"
    },
    {
        "i":  85,
        "title":  "Mahjong Ways 2",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0055.avif?t=1795721445000"
    },
    {
        "i":  86,
        "title":  "সহকারী অতিথি",
        "provider":  "YB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/YB/EN/YB0036.webp?t=1795721458000"
    },
    {
        "i":  87,
        "title":  "অ্যাভিয়েটর এক্সট্রা বেট",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB227.avif?t=1795721437000"
    },
    {
        "i":  88,
        "title":  "অন্দর বাহার",
        "provider":  "BSP",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BSP/EN/BSP051.webp?t=1795721424000"
    },
    {
        "i":  89,
        "title":  "হ্যাপি ফিশিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0009.avif?t=1795721437000"
    },
    {
        "i":  90,
        "title":  "Royale House",
        "provider":  "SG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/SG/EN/SG0133.avif?t=1795721453000"
    },
    {
        "i":  91,
        "title":  "৩ কয়েন ওয়াইল্ড হর্স",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0206.avif?t=1795721437000"
    },
    {
        "i":  92,
        "title":  "ক্রিকেট সাহ ৭৫",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0131.avif?t=1795721437000"
    },
    {
        "i":  93,
        "title":  "মুদ্রা ইউপি: বাজ",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG093.avif?t=1795721424000"
    },
    {
        "i":  94,
        "title":  "জঙ্গল কিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0037.webp?t=1795721437000"
    },
    {
        "i":  95,
        "title":  "কয়েন আগ্নেয়গিরি - ধরে রাখুন এবং জিতুন",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG071.avif?t=1795721424000"
    },
    {
        "i":  96,
        "title":  "বিশাল গোল্ড",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0489.avif?t=1795721441000"
    },
    {
        "i":  97,
        "title":  "জম্বি আউটব্রেক",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0148.avif?t=1795721445000"
    },
    {
        "i":  98,
        "title":  "Midas Fortune",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0119.avif?t=1795721445000"
    },
    {
        "i":  99,
        "title":  "Fortune Tiger",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0101.avif?t=1795721445000"
    },
    {
        "i":  100,
        "title":  "মিস্টিক পোশাক",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0145.avif?t=1795721445000"
    },
    {
        "i":  101,
        "title":  "Super Awesome",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0091.avif?t=1795721449000"
    },
    {
        "i":  102,
        "title":  "Legend of Perseus",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0111.avif?t=1795721445000"
    },
    {
        "i":  103,
        "title":  "ক্রিকেট কিং ১৮",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0126.avif?t=1795721437000"
    },
    {
        "i":  104,
        "title":  "ম্যাজিক এস",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB221.avif?t=1795721437000"
    },
    {
        "i":  105,
        "title":  "আজটেক ফায়ার 2 - ধরে রাখুন এবং জিতুন বহু",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG082.avif?t=1795721424000"
    },
    {
        "i":  106,
        "title":  "গো রাশ",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0108.avif?t=1795721437000"
    },
    {
        "i":  107,
        "title":  "Speed Winner",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0110.avif?t=1795721445000"
    },
    {
        "i":  108,
        "title":  "Cocktail Nights",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0098.avif?t=1795721445000"
    },
    {
        "i":  109,
        "title":  "অ্যাজটেক নারী যাজক",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0137.avif?t=1795721437000"
    },
    {
        "i":  110,
        "title":  "টাকার ড্রাগন",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0557.avif?t=1795721441000"
    },
    {
        "i":  111,
        "title":  "মিস্টার ট্রেজারের ভাগ্য",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0161.avif?t=1795721445000"
    },
    {
        "i":  112,
        "title":  "ক্যাশ ম্যানিয়া",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0142.avif?t=1795721445000"
    },
    {
        "i":  113,
        "title":  "সেভেনসেভেনসেভেন",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0020.avif?t=1795721437000"
    },
    {
        "i":  114,
        "title":  "3 ইজিপ্ট বক্স",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG086.avif?t=1795721424000"
    },
    {
        "i":  115,
        "title":  "উপজাতির জন্য",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0130.avif?t=1795721449000"
    },
    {
        "i":  116,
        "title":  "মেগা ফিশিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0007.avif?t=1795721437000"
    },
    {
        "i":  117,
        "title":  "ইনকা রানি",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0056.avif?t=1795721432000"
    },
    {
        "i":  118,
        "title":  "মিউজিয়াম ওয়ান্ডারস",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0155.avif?t=1795721445000"
    },
    {
        "i":  119,
        "title":  "গোল্ডেন ব্যাংক",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0029.webp?t=1795721437000"
    },
    {
        "i":  120,
        "title":  "চার্জ বাফেলো",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0032.avif?t=1795721437000"
    },
    {
        "i":  121,
        "title":  "সৌভাগ্যের রত্ন",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB226.avif?t=1795721437000"
    },
    {
        "i":  122,
        "title":  "বন্য বানর#3258",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0143.avif?t=1795721445000"
    },
    {
        "i":  123,
        "title":  "গোল্ডেন জোকার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0103.avif?t=1795721437000"
    },
    {
        "i":  124,
        "title":  "৩ কয়েন ট্রেজারস 2",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0193.avif?t=1795721437000"
    },
    {
        "i":  125,
        "title":  "চকোলেট ডিলাক্স",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0157.avif?t=1795721445000"
    },
    {
        "i":  126,
        "title":  "Prosperity Fortune Tree",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0114.webp?t=1795721445000"
    },
    {
        "i":  127,
        "title":  "Monopoly Big Baller",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4172.png?t=1795765240398"
    },
    {
        "i":  128,
        "title":  "পানচিং ওয়েলথ",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0061.avif?t=1795721432000"
    },
    {
        "i":  129,
        "title":  "গেইশার প্রতিশোধ",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0158.avif?t=1795721445000"
    },
    {
        "i":  130,
        "title":  "ক্যায়রোর রানি",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0487.webp?t=1795721441000"
    },
    {
        "i":  131,
        "title":  "সুপার রিচ",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0042.webp?t=1795721437000"
    },
    {
        "i":  132,
        "title":  "ডাইনোসর টাইকুন",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0004.webp?t=1795721437000"
    },
    {
        "i":  133,
        "title":  "স্পিড সুপার সিক বো",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4483.png?t=1795760361862"
    },
    {
        "i":  134,
        "title":  "রয়ালহাউস",
        "provider":  "FS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FS/EN/FS0030.avif?t=1795721433000"
    },
    {
        "i":  135,
        "title":  "আমিগো হট ১০০",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG004.avif?t=1795721421000"
    },
    {
        "i":  136,
        "title":  "হোর্ড ২ শীতকাল",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0133.avif?t=1795721449000"
    },
    {
        "i":  137,
        "title":  "ইয়াকুজা অনার",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0151.avif?t=1795721445000"
    },
    {
        "i":  138,
        "title":  "ট্রেজার রেইডার্স",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0034.avif?t=1795721432000"
    },
    {
        "i":  139,
        "title":  "বাংলা বিউটি",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0134.avif?t=1795721437000"
    },
    {
        "i":  140,
        "title":  "৩টি অ্যাজটেক মন্দির",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG112.avif?t=1795721424000"
    },
    {
        "i":  141,
        "title":  "Ways of the Qilin",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0084.avif?t=1795721445000"
    },
    {
        "i":  142,
        "title":  "মাহজং উপায় 3",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0119.avif?t=1795721449000"
    },
    {
        "i":  143,
        "title":  "সুপার স্টিকি পিগি",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG089.avif?t=1795721424000"
    },
    {
        "i":  144,
        "title":  "ইগুয়াজু এর উইংস",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0152.avif?t=1795721445000"
    },
    {
        "i":  145,
        "title":  "সৌভাগ্যের সাপ",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0159.avif?t=1795721445000"
    },
    {
        "i":  146,
        "title":  "ড্রাগন রত্ন",
        "provider":  "YB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/YB/EN/YB0047.avif?t=1795721458000"
    },
    {
        "i":  147,
        "title":  "সর্বশক্তিমান পসেইডন সাম্রাজ্য",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0602.avif?t=1795721441000"
    },
    {
        "i":  148,
        "title":  "রত্ন পাথর সোনা",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0141.webp?t=1795721445000"
    },
    {
        "i":  149,
        "title":  "২৫ কয়েন™ গ্র্যান্ড গোল্ড এডিশন",
        "provider":  "WD",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/WD/EN/WD0197.avif?t=1795721456000"
    },
    {
        "i":  150,
        "title":  "Football Studio",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4159.png?t=1795759717115"
    },
    {
        "i":  151,
        "title":  "ফরচুন মাঙ্কি",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0139.avif?t=1795721437000"
    },
    {
        "i":  152,
        "title":  "লোটাস স্পিড ব্যাকারাট C",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4541.png?t=1795764286264"
    },
    {
        "i":  153,
        "title":  "ভিয়েতনামিজ স্পিড বাকারা ৩",
        "provider":  "PP",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PP/EN/PP0947.avif?t=1795721448000"
    },
    {
        "i":  154,
        "title":  "Dragon Tiger",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4152.png?t=1795761287306"
    },
    {
        "i":  155,
        "title":  "৩ লাকি লায়ন",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0208.avif?t=1795721437000"
    },
    {
        "i":  156,
        "title":  "Bac Bo",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4131.png?t=1795765416200"
    },
    {
        "i":  157,
        "title":  "ড্রাগন সোয়ার - হাইপার ওয়াইল্ড",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB222.avif?t=1795721437000"
    },
    {
        "i":  158,
        "title":  "রিগাল ফ্রুটস ১০০০",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG096.avif?t=1795721421000"
    },
    {
        "i":  159,
        "title":  "মানি ব্যাগস ম্যান 2",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB176.avif?t=1795721437000"
    },
    {
        "i":  160,
        "title":  "আকর্ষনীয় মেয়ে",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB167.avif?t=1795721437000"
    },
    {
        "i":  161,
        "title":  "ক্রেজি হান্টার ২",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0164.avif?t=1795721437000"
    },
    {
        "i":  162,
        "title":  "777",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0021.avif?t=1795721449000"
    },
    {
        "i":  163,
        "title":  "মাইনস গোল্ড",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0119.avif?t=1795721437000"
    },
    {
        "i":  164,
        "title":  "পার্টি স্টার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0171.avif?t=1795721437000"
    },
    {
        "i":  165,
        "title":  "Double Fortune",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0035.avif?t=1795721445000"
    },
    {
        "i":  166,
        "title":  "Jurassic Kingdom",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0088.avif?t=1795721445000"
    },
    {
        "i":  167,
        "title":  "মোর ম্যাজিক অ্যাপল - ধরে রাখুন এবং জিতুন",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG066.avif?t=1795721424000"
    },
    {
        "i":  168,
        "title":  "Fortune Ox",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0078.avif?t=1795721446000"
    },
    {
        "i":  169,
        "title":  "ফল আক্রমণকারী",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG082.webp?t=1795721421000"
    },
    {
        "i":  170,
        "title":  "লিজেন্ড অফ ইনকা",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0046.avif?t=1795721432000"
    },
    {
        "i":  171,
        "title":  "পাপ্পু",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0105.avif?t=1795721437000"
    },
    {
        "i":  172,
        "title":  "গ্যালাক্সি বার্স্ট",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB193.avif?t=1795721437000"
    },
    {
        "i":  173,
        "title":  "Ganesha Fortune",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0057.avif?t=1795721445000"
    },
    {
        "i":  174,
        "title":  "Monopoly Live",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4173.png?t=1795763206357"
    },
    {
        "i":  175,
        "title":  "কোরিয়ান ড্রাগন বাঘ",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4543.png?t=1795760843841"
    },
    {
        "i":  176,
        "title":  "ফ্রুটি হুইল",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0178.avif?t=1795721437000"
    },
    {
        "i":  177,
        "title":  "Mafia Mayhem",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0136.avif?t=1795721445000"
    },
    {
        "i":  178,
        "title":  "Bakery Bonanza",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0123.avif?t=1795721445000"
    },
    {
        "i":  179,
        "title":  "Songkran Splash",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0124.avif?t=1795721445000"
    },
    {
        "i":  180,
        "title":  "সাফারি রাজা",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0191.avif?t=1795721437000"
    },
    {
        "i":  181,
        "title":  "সুগার ব্যাং ব্যাং",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0035.avif?t=1795721432000"
    },
    {
        "i":  182,
        "title":  "ফরচুন গডেস",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0057.avif?t=1795721432000"
    },
    {
        "i":  183,
        "title":  "ডেভিল ফায়ার ২",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0150.avif?t=1795721437000"
    },
    {
        "i":  184,
        "title":  "রিও কার্নিভাল",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0156.avif?t=1795721445000"
    },
    {
        "i":  185,
        "title":  "সুগার ব্যাং ব্যাং 2",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/BN/FC0062.png"
    },
    {
        "i":  186,
        "title":  "সুপার সিক বো",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4189.png?t=1795759753326"
    },
    {
        "i":  187,
        "title":  "Lightning Dice",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4169.png?t=1795757718266"
    },
    {
        "i":  188,
        "title":  "রক্ষস মানবের কথা",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0138.avif?t=1795721445000"
    },
    {
        "i":  189,
        "title":  "ইজিপ্ট বোনানজা",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0050.avif?t=1795721432000"
    },
    {
        "i":  190,
        "title":  "Mines",
        "provider":  "SPB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/SPB/EN/SPB006.avif?t=1795721453000"
    },
    {
        "i":  191,
        "title":  "অ্যাজটেক তিনগুণ সম্পদ পাওয়ার কম্বো",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0504.avif?t=1795721441000"
    },
    {
        "i":  192,
        "title":  "Tsar Treasures",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0137.avif?t=1795721445000"
    },
    {
        "i":  193,
        "title":  "সিংহ মুদ্রা",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG096.avif?t=1795721424000"
    },
    {
        "i":  194,
        "title":  "ক্র্যাশ গোল",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0163.avif?t=1795721437000"
    },
    {
        "i":  195,
        "title":  "বুক অফ গোল্ড",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0048.webp?t=1795721437000"
    },
    {
        "i":  196,
        "title":  "চায়না উৎসব",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG108.avif?t=1795721424000"
    },
    {
        "i":  197,
        "title":  "৩ লাকি পিগি",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0173.avif?t=1795721437000"
    },
    {
        "i":  198,
        "title":  "ট্রেজার কোয়েস্ট",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0203.avif?t=1795721437000"
    },
    {
        "i":  199,
        "title":  "Supermarket Spree",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0092.webp?t=1795721445000"
    },
    {
        "i":  200,
        "title":  "Rooster Rumble",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0105.avif?t=1795721445000"
    },
    {
        "i":  201,
        "title":  "রোমা গ্ল্যাডিয়াট্রিক্স",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0058.avif?t=1795721432000"
    },
    {
        "i":  202,
        "title":  "Diner Delights",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0117.avif?t=1795721445000"
    },
    {
        "i":  203,
        "title":  "রোমা এক্স ডিলাক্স",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0209.avif?t=1795721437000"
    },
    {
        "i":  204,
        "title":  "চূড়ান্ত স্ট্রাইকার",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0133.avif?t=1795721445000"
    },
    {
        "i":  205,
        "title":  "পিগি কয়েন",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG091.webp?t=1795721421000"
    },
    {
        "i":  206,
        "title":  "রকেট ডাইস",
        "provider":  "BGA",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BGA/EN/BGA017.avif?t=1795721423000"
    },
    {
        "i":  207,
        "title":  "স্বর্গীয় হাতির ভাগ্য",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0569.avif?t=1795721441000"
    },
    {
        "i":  208,
        "title":  "ড্রাগন ফিশিং",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB080.avif?t=1795721437000"
    },
    {
        "i":  209,
        "title":  "আগুনের পিরামিড",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0129.avif?t=1795721449000"
    },
    {
        "i":  210,
        "title":  "Dreams of Macau",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0060.avif?t=1795721445000"
    },
    {
        "i":  211,
        "title":  "কয়েন ইনফিনিটি সার্জ রিল",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0198.avif?t=1795721437000"
    },
    {
        "i":  212,
        "title":  "ডুমসডে র্যামপেজ",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0163.avif?t=1795721445000"
    },
    {
        "i":  213,
        "title":  "শোগুন",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0184.avif?t=1795721437000"
    },
    {
        "i":  214,
        "title":  "গ্রাফিটি দৌড়",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0162.avif?t=1795721445000"
    },
    {
        "i":  215,
        "title":  "রামি",
        "provider":  "BSP",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BSP/EN/BSP052.webp?t=1795721424000"
    },
    {
        "i":  216,
        "title":  "লাল দরজা রুলেট",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4334.png?t=1795761150867"
    },
    {
        "i":  217,
        "title":  "৩ কয়েন ট্রেজারস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0154.avif?t=1795721437000"
    },
    {
        "i":  218,
        "title":  "অলমাইটি জিউস এম্পায়ার",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0437.avif?t=1795721441000"
    },
    {
        "i":  219,
        "title":  "ক্র্যাশ টাচডাউন",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0210.avif?t=1795721437000"
    },
    {
        "i":  220,
        "title":  "বম্বিং ফিশিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0003.avif?t=1795721437000"
    },
    {
        "i":  221,
        "title":  "Ganesha Gold",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0031.avif?t=1795721445000"
    },
    {
        "i":  222,
        "title":  "Legacy of Kong Maxways",
        "provider":  "SG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/SG/EN/SG0145.avif?t=1795721453000"
    },
    {
        "i":  223,
        "title":  "সূর্য দেবতার উত্থান",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0086.avif?t=1795721445000"
    },
    {
        "i":  224,
        "title":  "মিষ্টি জার কম্বো",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0571.avif?t=1795721441000"
    },
    {
        "i":  225,
        "title":  "পাইরেট কুইন",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0106.avif?t=1795721437000"
    },
    {
        "i":  226,
        "title":  "পপ পপ ক্যান্ডি ১০০০",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB229.avif?t=1795721437000"
    },
    {
        "i":  227,
        "title":  "জিউস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0152.avif?t=1795721437000"
    },
    {
        "i":  228,
        "title":  "India Myth",
        "provider":  "MA",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MA/EN/MA0031.webp?t=1795721440000"
    },
    {
        "i":  229,
        "title":  "উচ্চ ফ্লায়ার",
        "provider":  "PP",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PP/EN/PP0841.avif?t=1795721448000"
    },
    {
        "i":  230,
        "title":  "লাকি কামিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0041.webp?t=1795721437000"
    },
    {
        "i":  231,
        "title":  "ম্যামথ তিনগুণ সম্পদ",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0506.avif?t=1795721441000"
    },
    {
        "i":  232,
        "title":  "Queen of Bounty",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0071.avif?t=1795721445000"
    },
    {
        "i":  233,
        "title":  "অল-স্টার ফিশিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0050.webp?t=1795721437000"
    },
    {
        "i":  234,
        "title":  "Ocean Palace Loot",
        "provider":  "FTG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FTG/EN/FTG002.webp?t=1795721433000"
    },
    {
        "i":  235,
        "title":  "আজটেক ধন Z",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0121.avif?t=1795721449000"
    },
    {
        "i":  236,
        "title":  "Dragon Tiger",
        "provider":  "SEX",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/SEX/EN/SEX003.avif?t=1795721453000"
    },
    {
        "i":  237,
        "title":  "পোশন উইজার্ড",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0161.avif?t=1795721437000"
    },
    {
        "i":  238,
        "title":  "Egypt\u0027s Book of Mystery",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0056.avif?t=1795721445000"
    },
    {
        "i":  239,
        "title":  "সোনালী অনন্ত",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0505.avif?t=1795721441000"
    },
    {
        "i":  240,
        "title":  "ক্রেজি হান্টার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0046.avif?t=1795721437000"
    },
    {
        "i":  241,
        "title":  "সামুরাই বিড়াল",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG099.avif?t=1795721421000"
    },
    {
        "i":  242,
        "title":  "GRAND BLUE",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0033.avif?t=1795721432000"
    },
    {
        "i":  243,
        "title":  "স্টক মার্কেট",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4494.png?t=1795763699882"
    },
    {
        "i":  244,
        "title":  "মাস্টার টাইগার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0107.avif?t=1795721437000"
    },
    {
        "i":  245,
        "title":  "ফারাও ট্রেজার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0040.avif?t=1795721437000"
    },
    {
        "i":  246,
        "title":  "নাইট মার্কেট 2",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0044.avif?t=1795721432000"
    },
    {
        "i":  247,
        "title":  "মাইটি সেভেনস",
        "provider":  "FS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FS/EN/FS0023.avif?t=1795721433000"
    },
    {
        "i":  248,
        "title":  "আতশবাজির বিস্ফোরণ",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB203.avif?t=1795721437000"
    },
    {
        "i":  249,
        "title":  "Diamond Mines",
        "provider":  "YB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/YB/EN/YB0032.avif?t=1795721458000"
    },
    {
        "i":  250,
        "title":  "ধনপাত্র X-Huge",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB131.avif?t=1795721437000"
    },
    {
        "i":  251,
        "title":  "Safari Wilds",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0130.avif?t=1795721445000"
    },
    {
        "i":  252,
        "title":  "লাকি টাইগার 1000",
        "provider":  "PP",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PP/EN/PP0972.avif?t=1795721449000"
    },
    {
        "i":  253,
        "title":  "রেস ট্র্যাক",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4534.png?t=1795758883254"
    },
    {
        "i":  254,
        "title":  "Garuda Gems",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0102.avif?t=1795721445000"
    },
    {
        "i":  255,
        "title":  "পঞ্চদশি মাছ ধরা",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB082.avif?t=1795721437000"
    },
    {
        "i":  256,
        "title":  "Sugar Boom",
        "provider":  "PS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PS/EN/PS0122.avif?t=1795721449000"
    },
    {
        "i":  257,
        "title":  "স্পিনড্রিফট ২",
        "provider":  "JDB",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JDB/EN/JDB148.avif?t=1795721437000"
    },
    {
        "i":  258,
        "title":  "নাইটফল হান্টিং",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0187.avif?t=1795721437000"
    },
    {
        "i":  259,
        "title":  "Butterfly Blossom",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0104.avif?t=1795721445000"
    },
    {
        "i":  260,
        "title":  "Mega Sic Bo",
        "provider":  "PP",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PP/EN/PP0167.avif?t=1795721448000"
    },
    {
        "i":  261,
        "title":  "গুপ্তধন দ্বীপ",
        "provider":  "PP",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PP/EN/PP0631.avif?t=1795721448000"
    },
    {
        "i":  262,
        "title":  "৩ পট ড্রাগনস",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0180.avif?t=1795721437000"
    },
    {
        "i":  263,
        "title":  "Fortune Mouse",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0048.avif?t=1795721445000"
    },
    {
        "i":  264,
        "title":  "ঈগল ওয়াইল্ডস",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG039.avif?t=1795721421000"
    },
    {
        "i":  265,
        "title":  "মৃত্যুদণ্ডপ্রাপ্ত বা বন্য",
        "provider":  "HS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/HS/EN/HS0034.avif?t=1795721434000"
    },
    {
        "i":  266,
        "title":  "ধন স্তূপ ওয়াইল্ডস",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0573.avif?t=1795721441000"
    },
    {
        "i":  267,
        "title":  "ফা ফা ফা",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0018.webp?t=1795721437000"
    },
    {
        "i":  268,
        "title":  "এক্সএক্সট্রিম লাইটনিং রুলেট",
        "provider":  "EG4",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/EG4/EN/EG4195.png?t=1795756645877"
    },
    {
        "i":  269,
        "title":  "সাম্বা",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0095.webp?t=1795721437000"
    },
    {
        "i":  270,
        "title":  "গোল্ড রাশ",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0054.webp?t=1795721437000"
    },
    {
        "i":  271,
        "title":  "Wild Fireworks",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0063.avif?t=1795721445000"
    },
    {
        "i":  272,
        "title":  "প্লিংকো",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0128.avif?t=1795721437000"
    },
    {
        "i":  273,
        "title":  "পাখির স্বর্গ - উড়ন্ত বাঘ",
        "provider":  "BT",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BT/EN/BT0099.avif?t=1795721425000"
    },
    {
        "i":  274,
        "title":  "অগ্নির রাজত্ব",
        "provider":  "MG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/MG/EN/MG0564.avif?t=1795721441000"
    },
    {
        "i":  275,
        "title":  "কয়েন বাতি",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG114.avif?t=1795721424000"
    },
    {
        "i":  276,
        "title":  "ডেভিল ফায়ার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0138.avif?t=1795721437000"
    },
    {
        "i":  277,
        "title":  "Cruise Royale",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0129.avif?t=1795721445000"
    },
    {
        "i":  278,
        "title":  "লিম্বোক্রিপ্টো",
        "provider":  "PAS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PAS/EN/PAS064.webp?t=1795721445000"
    },
    {
        "i":  279,
        "title":  "দেবতাদের সৌভাগ্যের মাছ ধরা",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0053.avif?t=1795721432000"
    },
    {
        "i":  280,
        "title":  "বোনাস হান্টার",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0085.avif?t=1795721437000"
    },
    {
        "i":  281,
        "title":  "রকেট জয়",
        "provider":  "BNG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BNG/EN/BNG113.avif?t=1795721424000"
    },
    {
        "i":  282,
        "title":  "Leprechaun Riches",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0041.avif?t=1795721445000"
    },
    {
        "i":  283,
        "title":  "পোকার উইন",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0060.avif?t=1795721432000"
    },
    {
        "i":  284,
        "title":  "ইনকা বিস্ময়",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0160.avif?t=1795721445000"
    },
    {
        "i":  285,
        "title":  "এল ডোরাডো ফল",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG077.webp?t=1795721421000"
    },
    {
        "i":  286,
        "title":  "হার্টস গো ওয়াইল্ড",
        "provider":  "AMG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/AMG/EN/AMG038.avif?t=1795721421000"
    },
    {
        "i":  287,
        "title":  "Forge of Wealth",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0135.avif?t=1795721445000"
    },
    {
        "i":  288,
        "title":  "Captain\u0027s Bounty",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0039.avif?t=1795721445000"
    },
    {
        "i":  289,
        "title":  "স্বর্ণব্যাঙ মাছ ধরা",
        "provider":  "BSP",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/BSP/EN/BSP013.webp?t=1795721424000"
    },
    {
        "i":  290,
        "title":  "চিলিহুয়াহুয়া",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0048.avif?t=1795721432000"
    },
    {
        "i":  291,
        "title":  "ফরচুন শীপ",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0054.avif?t=1795721432000"
    },
    {
        "i":  292,
        "title":  "জিউস",
        "provider":  "HS",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/HS/EN/HS0221.avif?t=1795721435000"
    },
    {
        "i":  293,
        "title":  "Mermaid Riches",
        "provider":  "PG",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/PG/EN/PG0089.avif?t=1795721445000"
    },
    {
        "i":  294,
        "title":  "টুইন উইন্স",
        "provider":  "JL",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0100.avif?t=1795721437000"
    },
    {
        "i":  295,
        "title":  "লাকি ফরচুন 3x3",
        "provider":  "FC",
        "img":  "https://images.23924894.com/TCG_GAME_ICONS/FC/EN/FC0052.avif?t=1795721432000"
    }
];