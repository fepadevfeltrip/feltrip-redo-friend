import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Loader2, Search, Home, MapPin, User, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HousingEntry {
  id: string;
  user_id: string;
  client_name: string;
  city: string;
  answer_territorio: string | null;
  answer_espaco: string | null;
  answer_corpo: string | null;
  answer_outro: string | null;
  answer_identidade: string | null;
  analise_poetica: string | null;
  perfil_resumido: string | null;
  pilar_corpo: string | null;
  pilar_territorio: string | null;
  pilar_outro: string | null;
  pilar_espaco: string | null;
  pilar_identidade: string | null;
  bairros_sugeridos: any[];
  fechamento: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export function HousingDataPanel() {
  const [entries, setEntries] = useState<HousingEntry[]>([]);
  const [filtered, setFiltered] = useState<HousingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('housing_responses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) throw error;

        const parsed: HousingEntry[] = (data || []).map(d => ({
          id: d.id,
          user_id: d.user_id,
          client_name: d.client_name || 'Curious Visitor',
          city: d.city,
          answer_territorio: d.answer_territorio,
          answer_espaco: d.answer_espaco,
          answer_corpo: d.answer_corpo,
          answer_outro: d.answer_outro,
          answer_identidade: d.answer_identidade,
          analise_poetica: d.analise_poetica,
          perfil_resumido: d.perfil_resumido,
          pilar_corpo: d.pilar_corpo,
          pilar_territorio: d.pilar_territorio,
          pilar_outro: d.pilar_outro,
          pilar_espaco: d.pilar_espaco,
          pilar_identidade: d.pilar_identidade,
          bairros_sugeridos: Array.isArray(d.bairros_sugeridos) ? d.bairros_sugeridos : [],
          fechamento: d.fechamento,
          created_at: d.created_at,
        }));

        setEntries(parsed);
        setFiltered(parsed);
      } catch (err) {
        console.error('Error fetching housing data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFiltered(entries);
    } else {
      const term = searchTerm.toLowerCase();
      setFiltered(entries.filter(e =>
        e.client_name.toLowerCase().includes(term) ||
        e.city.toLowerCase().includes(term) ||
        e.bairros_sugeridos.some((b: any) => b.bairro?.toLowerCase().includes(term))
      ));
    }
    setPage(0);
  }, [searchTerm, entries]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade, bairro..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} investigações</p>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Bairros Sugeridos</TableHead>
              <TableHead className="hidden md:table-cell">Perfil</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[60px]">Ver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{e.client_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {e.city}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-sm max-w-[200px] truncate" title={e.bairros_sugeridos.map((b: any) => b.bairro).join(', ')}>
                      {e.bairros_sugeridos.map((b: any) => b.bairro).join(', ') || '—'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[250px] truncate" title={e.perfil_resumido || ''}>
                  {e.perfil_resumido || '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(e.created_at)}
                </TableCell>
                <TableCell>
                  <HousingDetailDialog entry={e} />
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma investigação de moradia encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function HousingDetailDialog({ entry }: { entry: HousingEntry }) {
  const QUESTIONS_MAP: Record<string, { pillar: string; question: string }> = {
    answer_territorio: { pillar: 'O RITMO', question: 'No seu dia a dia, o que te irrita mais no ambiente onde você vive?' },
    answer_espaco: { pillar: 'A FRONTEIRA', question: 'Como você visualiza a divisão da sua casa?' },
    answer_corpo: { pillar: 'A LUZ', question: 'Como a luz natural influencia seu bem-estar em casa?' },
    answer_outro: { pillar: 'A DINÂMICA', question: 'Sua casa é um bunker para solitude ou um palco para encontros?' },
    answer_identidade: { pillar: 'VALOR', question: 'O que define valor para você: endereço icônico ou alma e história?' },
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            {entry.client_name} — {entry.city}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6">
            {/* Respostas do questionário */}
            <div>
              <h3 className="font-semibold text-sm mb-3 text-primary">Respostas do Questionário</h3>
              <div className="space-y-3">
                {Object.entries(QUESTIONS_MAP).map(([key, { pillar, question }]) => {
                  const answer = entry[key as keyof HousingEntry] as string | null;
                  return (
                    <div key={key} className="border rounded-lg p-3">
                      <p className="text-xs font-medium text-primary mb-1">{pillar}</p>
                      <p className="text-xs text-muted-foreground mb-1">{question}</p>
                      <p className="text-sm">{answer || '—'}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Perfil Resumido */}
            {entry.perfil_resumido && (
              <div>
                <h3 className="font-semibold text-sm mb-2 text-primary">Perfil Resumido</h3>
                <p className="text-sm text-muted-foreground">{entry.perfil_resumido}</p>
              </div>
            )}

            {/* Análise Poética */}
            {entry.analise_poetica && (
              <div>
                <h3 className="font-semibold text-sm mb-2 text-primary">Análise Poética</h3>
                <p className="text-sm text-muted-foreground italic">{entry.analise_poetica}</p>
              </div>
            )}

            {/* Análise por Pilar */}
            <div>
              <h3 className="font-semibold text-sm mb-3 text-primary">Análise por Pilar</h3>
              <div className="grid gap-2">
                {[
                  { label: 'Corpo', value: entry.pilar_corpo },
                  { label: 'Território', value: entry.pilar_territorio },
                  { label: 'O Outro', value: entry.pilar_outro },
                  { label: 'Espaço', value: entry.pilar_espaco },
                  { label: 'Identidade', value: entry.pilar_identidade },
                ].filter(p => p.value).map(p => (
                  <div key={p.label} className="border rounded p-2">
                    <p className="text-xs font-medium text-primary">{p.label}</p>
                    <p className="text-sm text-muted-foreground">{p.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bairros */}
            {entry.bairros_sugeridos.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3 text-primary">Bairros Sugeridos</h3>
                <div className="grid gap-2">
                  {entry.bairros_sugeridos.map((b: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-sm">{b.bairro}</span>
                        {b.vibe && <Badge variant="outline" className="text-[10px]">{b.vibe}</Badge>}
                      </div>
                      {b.descricaoVibe && <p className="text-xs text-muted-foreground">{b.descricaoVibe}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fechamento */}
            {entry.fechamento && (
              <div>
                <h3 className="font-semibold text-sm mb-2 text-primary">Fechamento</h3>
                <p className="text-sm text-muted-foreground italic">{entry.fechamento}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
