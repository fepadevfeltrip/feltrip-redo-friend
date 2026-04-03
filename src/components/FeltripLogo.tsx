import feltripLogo from "@/assets/feltrip-logo.png";

export const FeltripLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      <img 
        src={feltripLogo} 
        alt="Feltrip" 
        className="h-full w-auto object-contain"
      />
    </div>
  );
};
