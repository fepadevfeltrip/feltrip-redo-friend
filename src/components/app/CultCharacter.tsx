import React from "react";
import characterExplorer from "@/assets/cult-character-explorer.png";
import characterAnalyst from "@/assets/cult-character-analyst.png";
import characterGuide from "@/assets/cult-character-guide.png";
import characterCommunicator from "@/assets/cult-character-communicator.png";

export type CharacterVariant = "explorer" | "guide" | "analyst" | "communicator";

interface CultCharacterProps {
  variant: CharacterVariant;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

const VARIANT_IMAGES: Record<CharacterVariant, string> = {
  explorer: characterExplorer,
  analyst: characterAnalyst,
  guide: characterGuide,
  communicator: characterCommunicator,
};

const SIZES = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-36 h-36",
  xl: "w-48 h-48",
};

export const CultCharacter: React.FC<CultCharacterProps> = ({
  variant,
  size = "md",
  className = "",
  animate = true,
}) => {
  return (
    <div className={`${SIZES[size]} ${className} ${animate ? "animate-float" : ""}`}>
      <img
        src={VARIANT_IMAGES[variant]}
        alt="Cult AI"
        className="w-full h-full object-contain drop-shadow-lg"
        loading="lazy"
      />
    </div>
  );
};
