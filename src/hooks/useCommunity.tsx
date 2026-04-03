import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface CommunityEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  image_url: string | null;
  is_online: boolean;
  meeting_link: string | null;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
  participants_count?: number;
  user_participating?: boolean;
}

export interface CommunityMember {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
}

export function useCommunity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    // Fetch author info for each post
    const postsWithAuthors = await Promise.all(
      (data || []).map(async (post) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', post.user_id)
          .maybeSingle();
        
        return {
          ...post,
          author: profile || { full_name: 'Usuário', avatar_url: null }
        };
      })
    );

    setPosts(postsWithAuthors);
  };

  const fetchEvents = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('community_events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    // Fetch author info and participant count for each event
    const eventsWithDetails = await Promise.all(
      (data || []).map(async (event) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', event.user_id)
          .maybeSingle();

        const { count } = await (supabase as any)
          .from('event_participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'going');

        const { data: participation } = await (supabase as any)
          .from('event_participants')
          .select('id')
          .eq('event_id', event.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        return {
          ...event,
          author: profile || { full_name: 'Usuário', avatar_url: null },
          participants_count: count || 0,
          user_participating: !!participation
        };
      })
    );

    setEvents(eventsWithDetails);
  };

  const fetchMembers = async () => {
    if (!user) return;
    
    // Get current user's company
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!currentProfile?.company_id) {
      setMembers([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, avatar_url, city')
      .eq('company_id', currentProfile.company_id);

    if (error) {
      console.error('Error fetching members:', error);
      return;
    }

    setMembers(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPosts(), fetchEvents(), fetchMembers()]);
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const createPost = async (content: string, imageUrl?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl || null
      });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o post',
        variant: 'destructive'
      });
      return false;
    }

    await fetchPosts();
    toast({
      title: 'Sucesso',
      description: 'Post criado com sucesso!'
    });
    return true;
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o post',
        variant: 'destructive'
      });
      return;
    }

    await fetchPosts();
    toast({
      title: 'Sucesso',
      description: 'Post excluído'
    });
  };

  const createEvent = async (eventData: {
    title: string;
    description?: string;
    location?: string;
    event_date: string;
    is_online: boolean;
    meeting_link?: string;
    max_participants?: number;
  }) => {
    if (!user) return false;

    const { error } = await supabase
      .from('community_events')
      .insert({
        user_id: user.id,
        ...eventData
      });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o evento',
        variant: 'destructive'
      });
      return false;
    }

    await fetchEvents();
    toast({
      title: 'Sucesso',
      description: 'Evento criado com sucesso!'
    });
    return true;
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('community_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o evento',
        variant: 'destructive'
      });
      return;
    }

    await fetchEvents();
    toast({
      title: 'Sucesso',
      description: 'Evento excluído'
    });
  };

  const participateInEvent = async (eventId: string) => {
    if (!user) return;

    const { error } = await (supabase as any)
      .from('event_participants')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: 'going'
      });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar participação',
        variant: 'destructive'
      });
      return;
    }

    await fetchEvents();
    toast({
      title: 'Sucesso',
      description: 'Participação confirmada!'
    });
  };

  const cancelParticipation = async (eventId: string) => {
    if (!user) return;

    const { error } = await (supabase as any)
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar participação',
        variant: 'destructive'
      });
      return;
    }

    await fetchEvents();
    toast({
      title: 'Sucesso',
      description: 'Participação cancelada'
    });
  };

  return {
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
    refreshPosts: fetchPosts,
    refreshEvents: fetchEvents,
    refreshMembers: fetchMembers
  };
}
