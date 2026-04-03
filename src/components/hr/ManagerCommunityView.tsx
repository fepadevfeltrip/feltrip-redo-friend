import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface CompanyInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

export function ManagerCommunityView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('map');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    posts,
    events,
    isLoading: dataLoading,
    createPost,
    deletePost,
    createEvent,
    deleteEvent,
    participateInEvent,
    cancelParticipation,
    refreshPosts
  } = useCommunity();

  useEffect(() => {
    loadCompany();
  }, [user]);

  const loadCompany = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('id, name, logo_url')
          .eq('id', profile.company_id)
          .maybeSingle();

        setCompany(companyData);
      }
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manager can delete any post
  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);
    
    if (error) {
      toast({ title: 'Error', description: 'Could not delete post', variant: 'destructive' });
    } else {
      toast({ title: 'Post deleted', description: 'The post was removed by administrator' });
      refreshPosts();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>No community found.</p>
          <p className="text-sm">Create a community in the Community tab first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={company.logo_url || undefined} alt={company.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
              {company.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{company.name}</h1>
            <Badge variant="secondary" className="text-xs gap-1">
              <Shield className="h-3 w-3" />
              Administrator
            </Badge>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="map" className="flex items-center gap-1 text-xs">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Map</span>
          </TabsTrigger>
          <TabsTrigger value="wall" className="flex items-center gap-1 text-xs">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1 text-xs">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-1 text-xs">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-0">
          <CommunityMap isManager={true} />
        </TabsContent>

        <TabsContent value="wall" className="mt-0">
          <CommunityWall 
            posts={posts} 
            onCreatePost={createPost}
            onDeletePost={handleDeletePost}
            isLoading={dataLoading}
            isManager={true}
          />
        </TabsContent>

        <TabsContent value="groups" className="mt-0">
          <CommunityGroups isManager={true} />
        </TabsContent>

        <TabsContent value="events" className="mt-0">
          <CommunityEvents 
            events={events}
            onCreateEvent={createEvent}
            onDeleteEvent={deleteEvent}
            onParticipate={participateInEvent}
            onCancelParticipation={cancelParticipation}
            isLoading={dataLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}