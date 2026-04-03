import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, ArrowLeft, Send, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCommunityGroups, CommunityGroup, GroupPost } from '@/hooks/useCommunityGroups';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface CommunityGroupsProps {
  isManager?: boolean;
}

interface CompanyMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export function CommunityGroups({ isManager = false }: CommunityGroupsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    groups, 
    isLoading, 
    createGroup, 
    deleteGroup,
    fetchGroupPosts,
    createGroupPost,
    deleteGroupPost,
    refreshGroups
  } = useCommunityGroups();
  
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPostingPost, setIsPostingPost] = useState(false);
  
  // Create group dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Manage members dialog
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSavingMembers, setIsSavingMembers] = useState(false);

  const fetchCompanyMembers = async () => {
    if (!user) return;
    setIsLoadingMembers(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profile?.company_id) {
        const { data: members } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('company_id', profile.company_id);
        
        setCompanyMembers(members || []);
      }
    } catch (error) {
      console.error('Error fetching company members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    const { data } = await supabase
      .from('community_group_members')
      .select('user_id')
      .eq('group_id', groupId);
    
    return (data || []).map(m => m.user_id);
  };

  const handleOpenGroup = async (group: CommunityGroup) => {
    setSelectedGroup(group);
    setIsLoadingPosts(true);
    
    const [posts, members] = await Promise.all([
      fetchGroupPosts(group.id),
      fetchGroupMembers(group.id)
    ]);
    
    setGroupPosts(posts);
    setGroupMembers(members);
    setIsLoadingPosts(false);
  };

  const handleCloseGroup = () => {
    setSelectedGroup(null);
    setGroupPosts([]);
    setGroupMembers([]);
    setNewPostContent('');
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    await createGroup(newGroupName, newGroupDescription);
    setIsCreating(false);
    setIsCreateOpen(false);
    setNewGroupName('');
    setNewGroupDescription('');
  };

  const handleOpenManageMembers = async () => {
    if (!selectedGroup) return;
    await fetchCompanyMembers();
    const members = await fetchGroupMembers(selectedGroup.id);
    setSelectedMembers(members);
    setIsManageMembersOpen(true);
  };

  const handleSaveMembers = async () => {
    if (!selectedGroup) return;
    setIsSavingMembers(true);

    try {
      // Get current members
      const currentMembers = await fetchGroupMembers(selectedGroup.id);
      
      // Members to add
      const toAdd = selectedMembers.filter(id => !currentMembers.includes(id));
      // Members to remove
      const toRemove = currentMembers.filter(id => !selectedMembers.includes(id));

      // Add new members
      if (toAdd.length > 0) {
        const { error: addError } = await supabase
          .from('community_group_members')
          .insert(toAdd.map(user_id => ({ group_id: selectedGroup.id, user_id })));
        
        if (addError) throw addError;
      }

      // Remove members
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('community_group_members')
          .delete()
          .eq('group_id', selectedGroup.id)
          .in('user_id', toRemove);
        
        if (removeError) throw removeError;
      }

      toast({ title: 'Membros atualizados!' });
      setGroupMembers(selectedMembers);
      setIsManageMembersOpen(false);
      refreshGroups();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsSavingMembers(false);
    }
  };

  const handleCreatePost = async () => {
    if (!selectedGroup || !newPostContent.trim()) return;
    setIsPostingPost(true);
    const post = await createGroupPost(selectedGroup.id, newPostContent);
    if (post) {
      const posts = await fetchGroupPosts(selectedGroup.id);
      setGroupPosts(posts);
      setNewPostContent('');
    }
    setIsPostingPost(false);
  };

  const handleDeletePost = async (postId: string) => {
    await deleteGroupPost(postId);
    if (selectedGroup) {
      const posts = await fetchGroupPosts(selectedGroup.id);
      setGroupPosts(posts);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isMember = selectedGroup ? groupMembers.includes(user?.id || '') : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Group detail view
  if (selectedGroup) {
    const canPost = isMember || isManager;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleCloseGroup}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{selectedGroup.name}</h2>
            <p className="text-sm text-muted-foreground">{groupMembers.length} membros</p>
          </div>
          {isManager && (
            <Button variant="outline" size="sm" onClick={handleOpenManageMembers}>
              <UserPlus className="h-4 w-4 mr-1" />
              Membros
            </Button>
          )}
        </div>

        {selectedGroup.description && (
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {selectedGroup.description}
          </p>
        )}

        {/* Post input */}
        {canPost && (
          <Card>
            <CardContent className="pt-4">
              <Textarea
                placeholder="Escreva algo para o grupo..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[80px] mb-2"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleCreatePost} 
                  disabled={!newPostContent.trim() || isPostingPost}
                  size="sm"
                >
                  {isPostingPost ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Publicar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!canPost && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Você não é membro deste grupo
          </div>
        )}

        {/* Posts */}
        {isLoadingPosts ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : canPost ? (
          <div className="space-y-3">
            {groupPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma publicação ainda. Seja o primeiro a postar!
              </p>
            ) : (
              groupPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(post.author?.full_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{post.author?.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
                      </div>
                      {(post.user_id === user?.id || isManager) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : null}

        {/* Manage Members Dialog */}
        <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gerenciar Membros - {selectedGroup.name}</DialogTitle>
            </DialogHeader>
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {companyMembers.map((member) => (
                      <div 
                        key={member.user_id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleMember(member.user_id)}
                      >
                        <Checkbox 
                          checked={selectedMembers.includes(member.user_id)}
                          onCheckedChange={() => toggleMember(member.user_id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member.full_name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    {selectedMembers.length} selecionados
                  </span>
                  <Button onClick={handleSaveMembers} disabled={isSavingMembers}>
                    {isSavingMembers ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Groups list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Grupos
        </h2>
        {isManager && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Criar Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Grupo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Nome do grupo</label>
                  <Input
                    placeholder="Ex: Mães expatriadas"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição (opcional)</label>
                  <Textarea
                    placeholder="Descreva o propósito do grupo..."
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || isCreating}
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{isManager ? 'Nenhum grupo criado ainda' : 'Você não está em nenhum grupo'}</p>
            {isManager && <p className="text-sm mt-1">Crie um grupo para começar!</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <Card 
              key={group.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleOpenGroup(group)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {group.name}
                    </CardTitle>
                    {group.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {group.description}
                      </CardDescription>
                    )}
                  </div>
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroup(group.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{group.member_count} membros</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
