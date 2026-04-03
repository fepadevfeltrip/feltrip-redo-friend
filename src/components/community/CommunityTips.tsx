import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Heart, MessageCircle, Loader2, Send, Trash2 } from 'lucide-react';
import { useCommunityTips, SharedTip, TipComment } from '@/hooks/useCommunityTips';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, Locale } from 'date-fns';
import { ptBR, enUS, es, fr, zhCN } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const typeIcons: Record<string, string> = {
  food: '🍴',
  culture: '🎭',
  nature: '🌳',
  shopping: '🛍️',
  nightlife: '🌙',
  transport: '🚌',
  health: '🏥',
  other: '📍'
};

const dateLocales: Record<string, Locale> = {
  pt: ptBR,
  en: enUS,
  es: es,
  fr: fr,
  zh: zhCN
};

export function CommunityTips() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { sharedTips, isLoading, toggleLike, addComment, deleteComment, fetchComments } = useCommunityTips();
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, TipComment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState<string | null>(null);

  const currentLocale = dateLocales[i18n.language] || enUS;
  const getTypeLabel = (type: string) => `${typeIcons[type] || '📍'} ${t(`community.tipTypes.${type}`)}`;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleToggleComments = async (tipId: string) => {
    if (expandedTip === tipId) {
      setExpandedTip(null);
      return;
    }

    setExpandedTip(tipId);
    if (!comments[tipId]) {
      setLoadingComments(tipId);
      const tipComments = await fetchComments(tipId);
      setComments(prev => ({ ...prev, [tipId]: tipComments }));
      setLoadingComments(null);
    }
  };

  const handleAddComment = async (tipId: string) => {
    if (!newComment.trim()) return;
    
    const success = await addComment(tipId, newComment);
    if (success) {
      setNewComment('');
      const tipComments = await fetchComments(tipId);
      setComments(prev => ({ ...prev, [tipId]: tipComments }));
    }
  };

  const handleDeleteComment = async (commentId: string, tipId: string) => {
    await deleteComment(commentId);
    const tipComments = await fetchComments(tipId);
    setComments(prev => ({ ...prev, [tipId]: tipComments }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (sharedTips.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t('community.noTipsYet')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sharedTips.map((tip) => (
        <Card key={tip.id}>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={tip.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(tip.author?.full_name || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{tip.author?.full_name}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(tip.created_at), { addSuffix: true, locale: currentLocale })}
                  </span>
                </div>
                {tip.author?.city && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {tip.author.city}
                  </div>
                )}
                
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {getTypeLabel(tip.type)}
                    </span>
                  </div>
                  <h4 className="font-medium">{tip.title}</h4>
                  {tip.content && <p className="text-sm text-muted-foreground mt-1">{tip.content}</p>}
                  {tip.image_url && (
                    <img 
                      src={tip.image_url} 
                      alt={tip.title}
                      className="mt-2 rounded-lg max-h-48 object-cover"
                    />
                  )}
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 ${tip.user_liked ? 'text-red-500' : ''}`}
                    onClick={() => toggleLike(tip.id)}
                  >
                    <Heart className={`h-4 w-4 ${tip.user_liked ? 'fill-current' : ''}`} />
                    {tip.likes_count}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleToggleComments(tip.id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {tip.comments_count}
                  </Button>
                </div>

                {expandedTip === tip.id && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {loadingComments === tip.id ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {comments[tip.id]?.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={comment.author?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(comment.author?.full_name || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted rounded-lg p-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium">{comment.author?.full_name}</p>
                                {comment.user_id === user?.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={() => handleDeleteComment(comment.id, tip.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('community.writeComment')}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(tip.id)}
                            className="text-sm"
                          />
                          <Button size="sm" onClick={() => handleAddComment(tip.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
