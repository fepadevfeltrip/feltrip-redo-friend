import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface NavigationCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
}

export const NavigationCard = ({ icon: Icon, title, subtitle, onClick }: NavigationCardProps) => {
  return (
    <Card
      className="p-8 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgb(0_0_0_/0.08)] hover:border-primary/40 group"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="p-4 rounded-xl bg-muted/60 group-hover:bg-primary/10 transition-colors">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
};
