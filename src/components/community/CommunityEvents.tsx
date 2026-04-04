import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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
  Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CommunityEvent } from '@/hooks/useCommunity';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  isLoading
}: CommunityEventsProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    event_date: '',
    event_time: '',
    is_online: false,
    meeting_link: '',
    max_participants: ''
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
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined
    });

    if (success) {
      setFormData({
        title: '',
        description: '',
        location: '',
        event_date: '',
        event_time: '',
        is_online: false,
        meeting_link: '',
        max_participants: ''
      });
      setIsDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      {/* Create Event Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Criar Evento
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nome do evento"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do evento"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="event_date">Data *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="event_time">Hora *</Label>
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
              <Label htmlFor="is_online">Evento online</Label>
            </div>

            {formData.is_online ? (
              <div>
                <Label htmlFor="meeting_link">Link da reunião</Label>
                <Input
                  id="meeting_link"
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  placeholder="https://link-da-reuniao.com/..."
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Endereço do evento"
                />
              </div>
            )}

            <div>
              <Label htmlFor="max_participants">Máximo de participantes (opcional)</Label>
              <Input
                id="max_participants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                placeholder="Sem limite"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.event_date || !formData.event_time || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum evento próximo. Crie o primeiro!
          </CardContent>
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
                          {getInitials(event.author?.full_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {event.author?.full_name}
                      </span>
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

                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.event_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>

                  {event.is_online ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Video className="h-4 w-4" />
                      Online
                    </div>
                  ) : event.location && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
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
                    Acessar reunião
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
                      Cancelar participação
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onParticipate(event.id)}
                      className="w-full"
                      disabled={event.max_participants !== null && event.participants_count !== undefined && event.participants_count >= event.max_participants}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Participar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}