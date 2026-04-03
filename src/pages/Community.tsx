import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, Map, Loader2, Shield, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCommunity } from '@/hooks/useCommunity';
import { CommunityWall } from '@/components/community/CommunityWall';
import { CommunityEvents } from '@/components/community/CommunityEvents';
import { CommunityMap } from '@/components/community/CommunityMap';
import { CommunityGroups } from '@/components/community/CommunityGroups';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface CompanyInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

export default function Community() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('map');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [isCheckingCompany, setIsCheckingCompany] = useState(true);
  const [isManager, setIsManager] = useState(false);
  
  const {
    posts,
    events,
    members,
    isLoading,
    createPost,
    deletePost,
    createEvent,
    deleteEvent,
    participateInEvent,
    cancelParticipation,
    refreshMembers,
    refreshPosts
  } = useCommunity();

  const checkCompany = async () => {
    if (!user) {
      setIsCheckingCompany(false);
      return;
    }

    try {
      // Check if user is manager
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle();
      
      setIsManager(!!roleData);

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.company_id) {
        // User already has company - show community
        const { data: companyData } = await supabase
          .from('companies')
          .select('id, name, logo_url')
          .eq('id', profile.company_id)
          .maybeSingle();

        setCompany(companyData);
      } else {
        // No company - check if there's any company this user could belong to
        // For now, show "no community" state - user needs to be added by manager
        setCompany(null);
      }
    } catch (error) {
      console.error('Error checking company:', error);
    } finally {
      setIsCheckingCompany(false);
    }
  };


  // Manager can delete any post
  const handleDeletePost = async (postId: string) => {
    if (isManager) {
      // Managers can delete any post
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);
      
      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível excluir o post', variant: 'destructive' });
      } else {
        toast({ title: 'Post excluído', description: 'O post foi removido pelo administrador' });
        refreshPosts();
      }
    } else {
      deletePost(postId);
    }
  };

  useEffect(() => {
    checkCompany();
  }, [user]);


  if (isCheckingCompany) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // User not in any community - show message
  if (!company) {
    return (
      <div className="min-h-full bg-background">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">{t('community.title')}</h1>
          <div className="text-center py-12 px-4">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold mb-2">{t('community.noCommunity')}</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {t('community.noCommunityDesc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={company.logo_url || undefined} alt={company.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {company.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{company.name}</h1>
              {isManager && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Shield className="h-3 w-3" />
                  {t('community.admin')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="map" className="flex items-center gap-1 text-xs">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">{t('community.map')}</span>
            </TabsTrigger>
            <TabsTrigger value="wall" className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('community.feed')}</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-1 text-xs">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t('community.groups')}</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1 text-xs">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('community.events')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0">
            <CommunityMap isManager={isManager} />
          </TabsContent>

          <TabsContent value="wall" className="mt-0">
            <CommunityWall 
              posts={posts} 
              onCreatePost={createPost}
              onDeletePost={handleDeletePost}
              isLoading={isLoading}
              isManager={isManager}
            />
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            <CommunityGroups isManager={isManager} />
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            <CommunityEvents 
              events={events}
              onCreateEvent={createEvent}
              onDeleteEvent={deleteEvent}
              onParticipate={participateInEvent}
              onCancelParticipation={cancelParticipation}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
