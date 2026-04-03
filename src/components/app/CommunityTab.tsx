import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, MessageSquare, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/hooks/useCommunity';
import { CommunityWall } from '@/components/community/CommunityWall';
import { CommunityEvents } from '@/components/community/CommunityEvents';
import { CommunityGroups } from '@/components/community/CommunityGroups';
import { DoresDeliciasMap } from '@/components/community/DoresDeliciasMap';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const COPY = {
  pt: {
    title: "Dores & Delícias",
    subtitle: "O mapa afetivo da cidade",
    map: "Mapa",
    feed: "Feed",
    groups: "Grupos",
    events: "Eventos",
    blurWall: "Para entrar na rede e compartilhar dores e delícias, precisamos saber quem você é.",
    blurGroups: "Faça login para ver e participar dos grupos da comunidade.",
    blurEvents: "Faça login para ver os eventos da comunidade.",
    signInHint: 'Clique em "Sign In" no topo para entrar.',
  },
  en: {
    title: "Pains & Delights",
    subtitle: "The city's affective map",
    map: "Map",
    feed: "Feed",
    groups: "Groups",
    events: "Events",
    blurWall: "To join the network and share pains and delights, we need to know who you are.",
    blurGroups: "Sign in to see and join community groups.",
    blurEvents: "Sign in to see community events.",
    signInHint: 'Click "Sign In" at the top to enter.',
  },
  es: {
    title: "Dolores & Delicias",
    subtitle: "El mapa afectivo de la ciudad",
    map: "Mapa",
    feed: "Feed",
    groups: "Grupos",
    events: "Eventos",
    blurWall: "Para entrar en la red y compartir dolores y delicias, necesitamos saber quién eres.",
    blurGroups: "Inicia sesión para ver y unirte a los grupos de la comunidad.",
    blurEvents: "Inicia sesión para ver los eventos de la comunidad.",
    signInHint: 'Haz clic en "Sign In" arriba para entrar.',
  },
};

export default function CommunityTab() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) as "pt" | "en" | "es") || "pt";
  const t = COPY[lang] || COPY.pt;

  const { user, role } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('map');

  const isAdmin = role === 'admin' || role === 'owner';

  const {
    posts,
    events,
    isLoading,
    createPost,
    deletePost,
    createEvent,
    deleteEvent,
    participateInEvent,
    cancelParticipation,
    refreshPosts
  } = useCommunity();

  const handleDeletePost = async (postId: string) => {
    if (isAdmin) {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível excluir o post', variant: 'destructive' });
      } else {
        toast({ title: 'Post excluído' });
        refreshPosts();
      }
    } else {
      deletePost(postId);
    }
  };

  return (
    <div className="h-full bg-background">
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-xl font-display font-bold text-foreground">{t.title}</h1>
          <p className="text-xs text-muted-foreground">{t.subtitle}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="map" className="flex items-center gap-1 text-xs">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">{t.map}</span>
            </TabsTrigger>
            <TabsTrigger value="wall" className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t.feed}</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-1 text-xs">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t.groups}</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1 text-xs">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t.events}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0">
            <DoresDeliciasMap />
          </TabsContent>

          <TabsContent value="wall" className="mt-0">
            {!user ? (
              <BlurredContent message={t.blurWall} hint={t.signInHint} />
            ) : (
              <CommunityWall
                posts={posts}
                onCreatePost={createPost}
                onDeletePost={handleDeletePost}
                isLoading={isLoading}
                isManager={isAdmin}
              />
            )}
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            {!user ? (
              <BlurredContent message={t.blurGroups} hint={t.signInHint} />
            ) : (
              <CommunityGroups isManager={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            {!user ? (
              <BlurredContent message={t.blurEvents} hint={t.signInHint} />
            ) : (
              <CommunityEvents
                events={events}
                onCreateEvent={createEvent}
                onDeleteEvent={deleteEvent}
                onParticipate={participateInEvent}
                onCancelParticipation={cancelParticipation}
                isLoading={isLoading}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BlurredContent({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="filter blur-md pointer-events-none select-none opacity-60 space-y-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-muted rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20" />
              <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
            </div>
            <div className="h-3 w-full bg-muted-foreground/15 rounded" />
            <div className="h-3 w-3/4 bg-muted-foreground/15 rounded" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
        <div className="text-center px-6 max-w-xs">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-sm font-medium text-foreground mb-1">{message}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}
