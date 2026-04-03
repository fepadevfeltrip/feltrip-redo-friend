import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface SharedTip {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  type: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    city: string | null;
  };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

export interface TipComment {
  id: string;
  map_pin_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useCommunityTips() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sharedTips, setSharedTips] = useState<SharedTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSharedTips = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('map_pins')
      .select('*')
      .eq('is_shared_to_community', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared tips:', error);
      return;
    }

    const tipsWithDetails = await Promise.all(
      (data || []).map(async (tip) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, city')
          .eq('user_id', tip.user_id)
          .maybeSingle();

        const { count: likesCount } = await supabase
          .from('map_pin_likes')
          .select('*', { count: 'exact', head: true })
          .eq('map_pin_id', tip.id);

        const { count: commentsCount } = await supabase
          .from('map_pin_comments')
          .select('*', { count: 'exact', head: true })
          .eq('map_pin_id', tip.id);

        const { data: userLike } = await supabase
          .from('map_pin_likes')
          .select('id')
          .eq('map_pin_id', tip.id)
          .eq('user_id', user.id)
          .maybeSingle();

        return {
          ...tip,
          author: profile || { full_name: 'Usuário', avatar_url: null, city: null },
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          user_liked: !!userLike
        };
      })
    );

    setSharedTips(tipsWithDetails);
  };

  const fetchComments = async (mapPinId: string): Promise<TipComment[]> => {
    const { data, error } = await supabase
      .from('map_pin_comments')
      .select('*')
      .eq('map_pin_id', mapPinId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    const commentsWithAuthors = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', comment.user_id)
          .maybeSingle();

        return {
          ...comment,
          author: profile || { full_name: 'Usuário', avatar_url: null }
        };
      })
    );

    return commentsWithAuthors;
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchSharedTips();
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const toggleLike = async (mapPinId: string) => {
    if (!user) return;

    const tip = sharedTips.find(t => t.id === mapPinId);
    if (!tip) return;

    if (tip.user_liked) {
      const { error } = await supabase
        .from('map_pin_likes')
        .delete()
        .eq('map_pin_id', mapPinId)
        .eq('user_id', user.id);

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível remover curtida', variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('map_pin_likes')
        .insert({ map_pin_id: mapPinId, user_id: user.id });

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível curtir', variant: 'destructive' });
        return;
      }
    }

    await fetchSharedTips();
  };

  const addComment = async (mapPinId: string, content: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('map_pin_comments')
      .insert({ map_pin_id: mapPinId, user_id: user.id, content });

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível comentar', variant: 'destructive' });
      return false;
    }

    await fetchSharedTips();
    return true;
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('map_pin_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir comentário', variant: 'destructive' });
      return;
    }

    await fetchSharedTips();
  };

  const shareToCommmunity = async (mapPinId: string) => {
    const { error } = await supabase
      .from('map_pins')
      .update({ is_shared_to_community: true })
      .eq('id', mapPinId);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível compartilhar', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Sucesso', description: 'Dica compartilhada com a comunidade!' });
    await fetchSharedTips();
    return true;
  };

  const unshareFromCommunity = async (mapPinId: string) => {
    const { error } = await supabase
      .from('map_pins')
      .update({ is_shared_to_community: false })
      .eq('id', mapPinId);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover compartilhamento', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Sucesso', description: 'Dica removida da comunidade' });
    await fetchSharedTips();
    return true;
  };

  return {
    sharedTips,
    isLoading,
    toggleLike,
    addComment,
    deleteComment,
    fetchComments,
    shareToCommmunity,
    unshareFromCommunity,
    refresh: fetchSharedTips
  };
}
