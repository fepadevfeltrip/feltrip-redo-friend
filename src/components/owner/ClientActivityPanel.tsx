import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Loader2, Search, Trash2, ChevronLeft, ChevronRight, 
  Gem, Brain, AlertTriangle, User, Map, MapPin, Compass, Home, Languages
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ActivityRow {
  activity_type: string;
  record_id: string;
  user_id: string | null;
  client_name: string;
  client_city: string | null;
  user_tier: string | null;
  session_city: string | null;
  archetype: string | null;
  portal: string | null;
  gem_name: string | null;
  gem_category: string | null;
  created_at: string;
}

const PAGE_SIZE = 25;

export function ClientActivityPanel() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [purging, setPurging] = useState<string | null>(null);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // Use the unified client_activity_view
      const { data: allData, error } = await supabase
        .from('client_activity_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;

      const combined: ActivityRow[] = (allData || []).map(a => ({
        activity_type: a.activity_type || 'unknown',
        record_id: a.record_id || '',
        user_id: a.user_id || null,
        client_name: a.client_name || 'Curious Visitor',
        client_city: a.client_city || null,
        user_tier: a.user_tier || null,
        session_city: a.session_city || null,
        archetype: a.archetype || null,
        portal: a.portal || null,
        gem_name: a.gem_name || null,
        gem_category: a.gem_category || null,
        created_at: a.created_at || '',
      }));

      // Filter
      let filtered = combined;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = combined.filter(a =>
          a.client_name.toLowerCase().includes(term) ||
          a.session_city?.toLowerCase().includes(term) ||
          a.gem_name?.toLowerCase().includes(term) ||
          a.user_id?.toLowerCase().includes(term) ||
          a.activity_type.toLowerCase().includes(term)
        );
      }

      setTotalCount(filtered.length);

      // Paginate
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      setActivities(filtered.slice(from, to));
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, searchTerm]);

  const handlePurgeUser = async (userId: string, clientName: string) => {
    setPurging(userId);
    try {
      const { data, error } = await supabase.rpc('purge_user_data', { p_user_id: userId });
      if (error) throw error;
      toast.success(`Dados de "${clientName}" removidos com sucesso`, {
        description: JSON.stringify((data as any)?.deleted || {}, null, 2).substring(0, 200),
      });
      fetchActivities();
    } catch (err: any) {
      toast.error('Erro ao limpar dados', { description: err.message });
    } finally {
      setPurging(null);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const shortId = (id: string | null) => id ? id.substring(0, 8) + '…' : '—';

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Get unique users for the purge list
  const uniqueUsers: { id: string; name: string }[] = [];
  const seenUsers = new Set<string>();
  activities.forEach(a => {
    if (a.user_id && !seenUsers.has(a.user_id)) {
      seenUsers.add(a.user_id);
      uniqueUsers.push({ id: a.user_id, name: a.client_name });
    }
  });

  return (
    <div className="space-y-4">
      {/* Search & Info */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade, gem..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">{totalCount} registros</p>
      </div>

      {/* Activity Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">User ID</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="hidden md:table-cell">Detalhe</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[60px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((a) => (
                <TableRow key={`${a.activity_type}-${a.record_id}`}>
                  <TableCell>
                    {a.activity_type === 'session' ? (
                      <Badge variant="secondary" className="gap-1">
                        <Brain className="h-3 w-3" /> MRP
                      </Badge>
                    ) : a.activity_type === 'gem' ? (
                      <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                        <Gem className="h-3 w-3" /> Gem
                      </Badge>
                    ) : a.activity_type === 'presence_map' ? (
                      <Badge variant="secondary" className="gap-1 bg-accent/20">
                        <Map className="h-3 w-3" /> Mapa
                      </Badge>
                    ) : a.activity_type === 'city_map' ? (
                      <Badge variant="secondary" className="gap-1 bg-accent/20">
                        <MapPin className="h-3 w-3" /> Cidade
                      </Badge>
                    ) : a.activity_type.startsWith('concierge') ? (
                      <Badge variant="outline" className="gap-1 border-accent/30 text-accent-foreground">
                        <Compass className="h-3 w-3" /> Concierge
                      </Badge>
                    ) : a.activity_type === 'housing_complete' ? (
                      <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                        <Home className="h-3 w-3" /> Housing
                      </Badge>
                    ) : a.activity_type === 'language_studio' ? (
                      <Badge variant="secondary" className="gap-1 bg-violet-500/10 text-violet-700">
                        <Languages className="h-3 w-3" /> Idiomas
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        {a.activity_type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{a.client_name}</span>
                      {a.user_tier && a.user_tier !== 'free' && (
                        <Badge variant="outline" className="text-[10px] py-0">
                          {a.user_tier}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                    {shortId(a.user_id)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.session_city || a.client_city || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {a.activity_type === 'session'
                      ? [a.archetype, a.portal].filter(Boolean).join(' · ') || '—'
                      : a.activity_type === 'housing_complete'
                      ? [a.gem_name].filter(Boolean).join(' · ') || '—'
                      : a.activity_type === 'language_studio'
                      ? [a.gem_name, a.archetype].filter(Boolean).join(' · ') || '—'
                      : [a.gem_name, a.gem_category].filter(Boolean).join(' · ') || '—'
                    }
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(a.created_at)}
                  </TableCell>
                  <TableCell>
                    {a.user_id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Apagar TODOS os dados de {a.client_name}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso vai remover sessões, gems, questionários, pins, engajamento, 
                              perfil, roles e todos os dados associados a este usuário.
                              <br/><br/>
                              <strong className="text-destructive">Esta ação é irreversível.</strong>
                              <br/>
                              <code className="text-xs mt-2 block bg-muted p-2 rounded">
                                user_id: {a.user_id}
                              </code>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePurgeUser(a.user_id!, a.client_name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={purging === a.user_id}
                            >
                              {purging === a.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Apagar tudo
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {activities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" size="sm" 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" size="sm" 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
