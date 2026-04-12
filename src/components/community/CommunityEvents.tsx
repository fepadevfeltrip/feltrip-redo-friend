import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Video,
  Users,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Link as LinkIcon,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCommunity, CommunityEvent } from "@/hooks/useCommunity";
import { format, Locale } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
// IMPORTAÇÃO NOVA DO PAYWALL
import PricingPaywall from "@/components/app/components/PricingPaywall";

const COPY = {
  pt: {
    create: "Criar Evento",
    empty: "Nenhum evento próximo. Crie o primeiro!",
    modalTitle: "Novo Evento",
    titleLabel: "Título *",
    titlePlaceholder: "Nome do evento",
    descLabel: "Descrição",
    descPlaceholder: "Detalhes do evento",
    dateLabel: "Data *",
    timeLabel: "Hora *",
    onlineLabel: "Evento online",
    linkLabel: "Link da reunião",
    linkPlaceholder: "https://meet.google.com/...",
    locationLabel: "Local",
    locationPlaceholder: "Endereço do evento",
    maxLabel: "Máximo de participantes (opcional)",
    maxPlaceholder: "Sem limite",
    cancel: "Cancelar participação",
    join: "Participar",
    access: "Acessar reunião",
    upsellTitle: "Crie o seu próprio evento",
    upsellDesc: "Desbloqueie a habilidade de hospedar experiências na cidade.",
    becomePremium: "Seja Premium",
    planningBigger: "Planejando algo maior?",
    corporateText: "Experiências corporativas ou em grupo → fale com a gente.",
    contactWhatsApp: "Contate-nos no WhatsApp",
    individualDisclaimer: "Nota: Estes são eventos criados e organizados por pessoas físicas da comunidade.",
  },
  en: {
    create: "Create Event",
    empty: "No upcoming events. Create the first one!",
    modalTitle: "New Event",
    titleLabel: "Title *",
    titlePlaceholder: "Event name",
    descLabel: "Description",
    descPlaceholder: "Event details",
    dateLabel: "Date *",
    timeLabel: "Time *",
    onlineLabel: "Online event",
    linkLabel: "Meeting link",
    linkPlaceholder: "https://meeting.link.com/...",
    locationLabel: "Location",
    locationPlaceholder: "Event address",
    maxLabel: "Max participants (optional)",
    maxPlaceholder: "No limit",
    cancel: "Cancel participation",
    join: "Join",
    access: "Access meeting",
    upsellTitle: "Create your own event",
    upsellDesc: "Unlock the ability to host experiences in the city.",
    becomePremium: "Become Premium",
    planningBigger: "Planning something bigger?",
    corporateText: "Corporate or group experiences → talk to us.",
    contactWhatsApp: "Contact us on WhatsApp",
    individualDisclaimer: "Note: These are events created and hosted by individuals in the community.",
  },
  es: {
    create: "Crear Evento",
    empty: "No hay eventos próximos. ¡Crea el primero!",
    modalTitle: "Nuevo Evento",
    titleLabel: "Título *",
    titlePlaceholder: "Nombre del evento",
    descLabel: "Descripción",
    descPlaceholder: "Detalles del evento",
    dateLabel: "Fecha *",
    timeLabel: "Hora *",
    onlineLabel: "Evento en línea",
    linkLabel: "Enlace de la reunión",
    linkPlaceholder: "https://enlace.reunion.com/...",
    locationLabel: "Ubicación",
    locationPlaceholder: "Dirección del evento",
    maxLabel: "Máximo de participantes (opcional)",
    maxPlaceholder: "Sin límite",
    cancel: "Cancelar participación",
    join: "Participar",
    access: "Acceder a la reunión",
    upsellTitle: "Crea tu propio evento",
    upsellDesc: "Desbloquea la capacidad de organizar experiencias en la ciudad.",
    becomePremium: "Hazte Premium",
    planningBigger: "¿Planeas algo más grande?",
    corporateText: "Experiencias corporativas o grupales → habla con nosotros.",
    contactWhatsApp: "Contáctanos en WhatsApp",
    individualDisclaimer: "Nota: Estos son eventos creados y organizados por individuos de la comunidad.",
  },
};

const dateLocales: Record<string, Locale> = {
  pt: ptBR,
  en: enUS,
  es: es,
};

interface CommunityEventsProps {
  events: CommunityEvent[];
  onCreateEvent: (eventData: {
    title: string;
    description?: string;
    location?: string;
    event_date: string;
    is_online: boolean;
    meeting_link?: string;
    max_participants?: number;
  }) => Promise<boolean>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onParticipate: (eventId: string) => Promise<void>;
  onCancelParticipation: (eventId: string) => Promise<void>;
  isLoading: boolean;
}

export function CommunityEvents({
  events,
  onCreateEvent,
  onDeleteEvent,
  onParticipate,
  onCancelParticipation,
  isLoading,
}: CommunityEventsProps) {
  const { user, role } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) as "pt" | "en" | "es") || "pt";
  const t = COPY[lang] || COPY.pt;
  const currentLocale = dateLocales[lang] || ptBR;

  // Verifica se o usuário tem privilégios premium, manager ou owner
  const isPremium =
    role === "admin" ||
    role === "owner" ||
    profile?.user_tier?.includes("premium") ||
    profile?.user_tier === "explorer" ||
    profile?.user_tier === "personal_map";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // NOVO ESTADO: Controla a exibição do modal de preços
  const [showPaywall, setShowPaywall] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    event_time: "",
    is_online: false,
    meeting_link: "",
    max_participants: "",
  });

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.event_date || !formData.event_time) return;

    setIsSubmitting(true);
    const eventDateTime = `${formData.event_date}T${formData.event_time}:00`;

    const success = await onCreateEvent({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      location: formData.is_online ? undefined : formData.location.trim() || undefined,
      event_date: eventDateTime,
      is_online: formData.is_online,
      meeting_link: formData.is_online ? formData.meeting_link.trim() || undefined : undefined,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
    });

    if (success) {
      setFormData({
        title: "",
        description: "",
        location: "",
        event_date: "",
        event_time: "",
        is_online: false,
        meeting_link: "",
        max_participants: "",
      });
      setIsDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controle de Acesso: Premium cria evento, Free vê Banner */}
      {isPremium ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t.create}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.modalTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">{t.titleLabel}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t.titlePlaceholder}
                />
              </div>

              <div>
                <Label htmlFor="description">{t.descLabel}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.descPlaceholder}
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="event_date">{t.dateLabel}</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="event_time">{t.timeLabel}</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_online"
                  checked={formData.is_online}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_online: checked })}
                />
                <Label htmlFor="is_online">{t.onlineLabel}</Label>
              </div>

              {formData.is_online ? (
                <div>
                  <Label htmlFor="meeting_link">{t.linkLabel}</Label>
                  <Input
                    id="meeting_link"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder={t.linkPlaceholder}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="location">{t.locationLabel}</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder={t.locationPlaceholder}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="max_participants">{t.maxLabel}</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder={t.maxPlaceholder}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!formData.title.trim() || !formData.event_date || !formData.event_time || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {t.create}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <div>
              <h3 className="font-bold text-lg">{t.upsellTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.upsellDesc}</p>
            </div>
            {/* BOTÃO ATUALIZADO: Agora abre o modal em vez de navegar */}
            <Button onClick={() => setShowPaywall(true)} className="w-full">
              {t.becomePremium}
            </Button>
            <div className="pt-4 border-t border-border/50">
              <h4 className="font-medium text-sm">{t.planningBigger}</h4>
              <p className="text-xs text-muted-foreground mb-3">{t.corporateText}</p>
              <Button
                variant="outline"
                onClick={() => window.open("https://wa.me/message/BG24GCPKNF6KG1")}
                className="w-full"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {t.contactWhatsApp}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placa: Aviso de responsabilidade de pessoas físicas */}
      <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex items-start gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-600" />
        <p>{t.individualDisclaimer}</p>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">{t.empty}</CardContent>
        </Card>
      ) : (
        events.map((event) => (
          <Card key={event.id}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={event.author?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(event.author?.full_name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{event.author?.full_name}</span>
                    </div>
                  </div>
                  {event.user_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}

                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.event_date), "dd 'de' MMMM 'às' HH:mm", { locale: currentLocale })}
                  </div>

                  {event.is_online ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Video className="h-4 w-4" />
                      Online
                    </div>
                  ) : (
                    event.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )
                  )}

                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {event.participants_count}
                    {event.max_participants && ` / ${event.max_participants}`}
                  </div>
                </div>

                {event.is_online && event.meeting_link && (
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {t.access}
                  </a>
                )}

                <div className="pt-2 border-t">
                  {event.user_participating ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelParticipation(event.id)}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t.cancel}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onParticipate(event.id)}
                      className="w-full"
                      disabled={
                        event.max_participants !== null &&
                        event.participants_count !== undefined &&
                        event.participants_count >= event.max_participants
                      }
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t.join}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* RENDERIZA O PAYWALL QUANDO showPaywall FOR TRUE */}
      {showPaywall && <PricingPaywall onClose={() => setShowPaywall(false)} lang={lang as any} />}
    </div>
  );
}
