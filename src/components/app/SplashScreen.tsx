import React, { useEffect, useState } from "react";
import { CultCharacter } from "./CultCharacter";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1200);
    const t2 = setTimeout(onComplete, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <CultCharacter variant="explorer" size="xl" animate />
      <h1
        className="mt-6 font-serif font-bold tracking-tight text-foreground"
        style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)" }}
      >
        Cult AI
      </h1>
      <p className="mt-1 text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-bold">
        by Feltrip
      </p>
    </div>
  );
};
