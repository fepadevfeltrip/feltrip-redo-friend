import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CommunityGroup {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useCommunityGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('community_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch member counts and membership status
      const groupsWithDetails = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('community_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          const { data: membership } = await supabase
            .from('community_group_members')
            .select('id')
            .eq('group_id', group.id)
            .eq('user_id', user.id)
            .maybeSingle();

          return {
            ...group,
            member_count: count || 0,
            is_member: !!membership,
          };
        })
      );

      setGroups(groupsWithDetails);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      // Get company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) {
        toast({ title: 'Erro', description: 'Você não está em uma empresa', variant: 'destructive' });
        return null;
      }

      const { data, error } = await supabase
        .from('community_groups')
        .insert({
          name,
          description,
          company_id: profile.company_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Grupo criado!', description: `O grupo "${name}" foi criado com sucesso.` });
      fetchGroups();
      return data;
    } catch (error: any) {
      toast({ title: 'Erro ao criar grupo', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('community_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({ title: 'Grupo excluído' });
      fetchGroups();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir grupo', description: error.message, variant: 'destructive' });
    }
  };

  const fetchGroupPosts = async (groupId: string): Promise<GroupPost[]> => {
    try {
      const { data, error } = await supabase
        .from('community_group_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author info
      const postsWithAuthors = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', post.user_id)
            .maybeSingle();

          return {
            ...post,
            author: profile || { full_name: 'Usuário', avatar_url: null },
          };
        })
      );

      return postsWithAuthors;
    } catch (error) {
      console.error('Error fetching group posts:', error);
      return [];
    }
  };

  const createGroupPost = async (groupId: string, content: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('community_group_posts')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({ title: 'Erro ao postar', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteGroupPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('community_group_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  return {
    groups,
    isLoading,
    createGroup,
    deleteGroup,
    fetchGroupPosts,
    createGroupPost,
    deleteGroupPost,
    refreshGroups: fetchGroups,
  };
}
