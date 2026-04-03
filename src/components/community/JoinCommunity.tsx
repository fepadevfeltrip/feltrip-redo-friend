import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface JoinCommunityProps {
  onJoined: () => void;
}

export function JoinCommunity({ onJoined }: JoinCommunityProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!code.trim() || !user) return;

    setIsJoining(true);
    try {
      const { data, error } = await supabase.rpc('join_community_with_code', {
        _code: code.trim().toUpperCase(),
        _user_id: user.id
      });

      if (error) throw error;

      toast({ title: 'Sucesso!', description: 'Você entrou na comunidade!' });
      onJoined();
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Código inválido ou expirado', 
        variant: 'destructive' 
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Entrar em uma Comunidade</CardTitle>
        <CardDescription>
          Digite o código de convite fornecido pelo RH da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Código de convite (ex: ABC123)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono text-center text-lg tracking-wider"
            maxLength={10}
          />
        </div>
        <Button 
          onClick={handleJoin} 
          disabled={isJoining || !code.trim()}
          className="w-full"
        >
          {isJoining ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar na Comunidade'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
