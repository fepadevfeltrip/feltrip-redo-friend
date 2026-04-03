import React from "react";
import { DiagnosisQuestion } from "../types";

interface ScaleQuestionProps {
  data: DiagnosisQuestion;
  onSelect: (value: number) => void;
}

export const ScaleQuestion: React.FC<ScaleQuestionProps> = ({ data, onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in-up w-full max-w-lg mx-auto">
      <div className="text-center space-y-4">
        {/* Title in Mustard */}
        <h3 className="text-boba-mustard font-bold uppercase tracking-widest text-sm">{data.label}</h3>
        <p className="text-2xl sm:text-3xl font-serif text-boba-teal dark:text-boba-offWhite font-medium leading-tight">
          {data.question}
        </p>
      </div>

      <div className="w-full">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{data.lowLabel}</span>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{data.highLabel}</span>
        </div>

        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => onSelect(num)}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-boba-teal/20 dark:border-white/20 
                         hover:bg-boba-coral hover:border-boba-coral hover:text-white 
                         dark:text-boba-offWhite dark:hover:bg-boba-coral
                         transition-all duration-300 font-serif text-xl font-bold
                         focus:outline-none focus:ring-4 focus:ring-boba-coral/30"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
