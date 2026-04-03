import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Heart, GraduationCap, MessageCircle } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/351912345678"; // Replace with actual Feltrip WhatsApp number

const InternalPartners = () => {
  // Specialists will be added by the company HR
  const specialists: Array<{
    icon: typeof Brain;
    title: string;
    description: string;
    bgColor: string;
    iconColor: string;
  }> = [];

  const handleRequestService = () => {
    window.open(WHATSAPP_LINK, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">Feltrip Local Services</h1>
        <p className="text-muted-foreground">
          Request specialized support services for your team members
        </p>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-foreground text-center">
          Contact us via WhatsApp to schedule consultations for your employees with our internal specialists.
        </p>
      </Card>

      {/* Specialists List */}
      <div className="space-y-4">
        {specialists.map((specialist) => {
          const Icon = specialist.icon;
          return (
            <Card key={specialist.title} className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl ${specialist.bgColor}`}>
                  <Icon className={`h-8 w-8 ${specialist.iconColor}`} />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-primary">
                      {specialist.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {specialist.description}
                    </p>
                  </div>
                  <Button
                    onClick={handleRequestService}
                    className="w-full gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Request via WhatsApp
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default InternalPartners;
