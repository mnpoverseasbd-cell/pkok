import { useEffect, useState } from "react";
import { X } from "lucide-react";
import welcomeImg from "@/assets/welcome-popup.jpg";

export function WelcomePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("welcome_popup_dismissed");
    if (!dismissed) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    sessionStorage.setItem("welcome_popup_dismissed", "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="close"
          className="absolute -right-2 -top-2 z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-white/30 bg-black/80 text-white shadow-lg transition-colors hover:bg-[var(--neon-pink)]"
        >
          <X className="h-5 w-5" />
        </button>
        <img
          src={welcomeImg}
          alt="Welcome bonus"
          width={896}
          height={1024}
          className="w-full rounded-2xl shadow-[0_20px_80px_-10px_rgba(239,41,105,0.5)]"
        />
      </div>
    </div>
  );
}
