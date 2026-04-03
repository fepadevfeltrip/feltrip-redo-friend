import React from "react";

interface CityButtonProps {
  label: string;
  onClick: () => void;
  colorClass?: string;
}

export const CityButton: React.FC<CityButtonProps> = ({ label, onClick, colorClass }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-4 px-6 rounded-xl text-lg font-serif font-medium tracking-wide shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
        bg-white text-boba-teal border-2 border-boba-teal/20 
        hover:border-boba-coral hover:text-boba-coral
        dark:bg-boba-darkCard dark:text-boba-offWhite dark:border-boba-offWhite/10 dark:hover:border-boba-coral dark:hover:text-boba-coral
        ${colorClass || ""}
      `}
    >
      {label}
    </button>
  );
};
