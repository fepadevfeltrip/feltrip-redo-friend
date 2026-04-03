import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Loader2, Search, Mail, Bell, BellOff, MailCheck, MailX } from 'lucide-react';

interface PrefRow {
  pref_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = useState<PrefRow[]>([]);
  const [filtered, setFiltered] = useState<PrefRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_notification_preferences_with_email');
        if (error) throw error;
        setPrefs((data as PrefRow[]) || []);
        setFiltered((data as PrefRow[]) || []);
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFiltered(prefs);
    } else {
      const term = searchTerm.toLowerCase();
      setFiltered(prefs.filter(p =>
        p.user_name.toLowerCase().includes(term) ||
        p.user_email.toLowerCase().includes(term) ||
        p.user_id.toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, prefs]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

  const shortId = (id: string) => id.substring(0, 8) + '…';

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
            placeholder="Buscar por nome, email, ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} preferências</p>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="hidden md:table-cell">User ID</TableHead>
              <TableHead className="text-center">E-mail Notif.</TableHead>
              <TableHead className="text-center">Push Notif.</TableHead>
              <TableHead>Atualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.pref_id}>
                <TableCell className="font-medium">{p.user_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[200px]" title={p.user_email}>
                      {p.user_email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                  {shortId(p.user_id)}
                </TableCell>
                <TableCell className="text-center">
                  {p.email_notifications ? (
                    <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700">
                      <MailCheck className="h-3 w-3" /> Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <MailX className="h-3 w-3" /> Inativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {p.push_notifications ? (
                    <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-700">
                      <Bell className="h-3 w-3" /> Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <BellOff className="h-3 w-3" /> Inativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(p.updated_at)}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma preferência de notificação encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
