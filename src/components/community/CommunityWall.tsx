import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Trash2, MessageSquare, Loader2, Shield, MoreVertical, Flag, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { CommunityPost } from "@/hooks/useCommunity";
import { formatDistanceToNow, Locale } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { toast } from "sonner";

const COPY = {
  pt: {
    share: "Compartilhar",
    placeholder: "O que você quer compartilhar com a comunidade?",
    publish: "Publicar",
    empty: "Nenhum post ainda. Seja o primeiro a compartilhar!",
    deleteAdmin: "Excluir como administrador",
    delete: "Excluir",
    report: "Denunciar Post",
    block: "Bloquear Usuário",
    blocked: "Usuário bloqueado. Você não verá mais as publicações desta pessoa.",
  },
  en: {
    share: "Share",
    placeholder: "What do you want to share with the community?",
    publish: "Post",
    empty: "No posts yet. Be the first to share!",
    deleteAdmin: "Delete as administrator",
    delete: "Delete",
    report: "Report Post",
    block: "Block User",
    blocked: "User blocked. You will no longer see posts from this person.",
  },
  es: {
    share: "Compartir",
    placeholder: "¿Qué quieres compartir con la comunidad?",
    publish: "Publicar",
    empty: "Aún no hay publicaciones. ¡Sé el primero en compartir!",
    deleteAdmin: "Eliminar como administrador",
    delete: "Eliminar",
    report: "Denunciar Publicación",
    block: "Bloquear Usuario",
    blocked: "Usuario bloqueado. Ya no verás las publicaciones de esta persona.",
  },
};

const dateLocales: Record<string, Locale> = {
  pt: ptBR,
  en: enUS,
  es: es,
};

const BLOCKED_USERS_KEY = "feltrip_blocked_users";

function getBlockedUsers(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BLOCKED_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function addBlockedUser(userId: string) {
  const blocked = getBlockedUsers();
  if (!blocked.includes(userId)) {
    blocked.push(userId);
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blocked));
  }
}

interface CommunityWallProps {
  posts: CommunityPost[];
  onCreatePost: (content: string) => Promise<boolean>;
  onDeletePost: (postId: string) => Promise<void>;
  isLoading: boolean;
  isManager?: boolean;
}

export function CommunityWall({ posts, onCreatePost, onDeletePost, isLoading, isManager = false }: CommunityWallProps) {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>(getBlockedUsers);

  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) as "pt" | "en" | "es") || "pt";
  const t = COPY[lang] || COPY.pt;
  const currentLocale = dateLocales[lang] || ptBR;

  const handleSubmit = async () => {
    if (!newPost.trim()) return;
    setIsSubmitting(true);
    const success = await onCreatePost(newPost.trim());
    if (success) setNewPost("");
    setIsSubmitting(false);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleReport = (post: CommunityPost) => {
    const subject = encodeURIComponent("Denúncia de Conteúdo - Cult AI");
    const body = encodeURIComponent(
      `Gostaria de denunciar este conteúdo.\n\nID do post: ${post.id}\nAutor: ${post.author?.full_name || "Desconhecido"}\nConteúdo: ${post.content?.substring(0, 200) || ""}`
    );
    window.open(`mailto:info@feltrip.com?subject=${subject}&body=${body}`, "_self");
  };

  const handleBlock = (userId: string) => {
    addBlockedUser(userId);
    setBlockedUsers(getBlockedUsers());
    toast(t.blocked);
  };

  const visiblePosts = posts.filter((p) => !blockedUsers.includes(p.user_id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t.share}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={t.placeholder}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!newPost.trim() || isSubmitting} size="sm">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {t.publish}
            </Button>
          </div>
        </CardContent>
      </Card>

      {visiblePosts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">{t.empty}</CardContent>
        </Card>
      ) : (
        visiblePosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(post.author?.full_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{post.author?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: currentLocale,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {(post.user_id === user?.id || isManager) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeletePost(post.id)}
                          title={isManager && post.user_id !== user?.id ? t.deleteAdmin : t.delete}
                        >
                          {isManager && post.user_id !== user?.id ? (
                            <Shield className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {post.user_id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleReport(post)}>
                              <Flag className="h-4 w-4 mr-2" />
                              {t.report}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleBlock(post.user_id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              {t.block}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="Post image" className="mt-3 rounded-lg max-h-64 object-cover" />
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
