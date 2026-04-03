import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const WhatsAppButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/community")}
      className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Entrar na Comunidade"
    >
      <MapPin className="h-6 w-6" />
    </button>
  );
};
