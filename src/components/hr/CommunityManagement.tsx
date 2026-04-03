import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Copy, Users, Building2, Trash2, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CommunityLinkManager } from './CommunityLinkManager';
interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

interface RegistrationCode {
  id: string;
  code: string;
  role: 'expatriate' | 'manager' | 'community_member' | 'admin' | 'owner'; // DB enum uses 'expatriate', displayed as 'Premium Company'
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  company_id: string | null;
}

interface CommunityMember {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
}

export function CommunityManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [codeQuantity, setCodeQuantity] = useState<number>(1);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get current user's profile and company
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user!.id)
        .maybeSingle();

      console.log('Profile fetch result:', { profile, profileError, userId: user!.id });

      if (profile?.company_id) {
        // Load company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .maybeSingle();

        console.log('Company fetch result:', { companyData, companyError, companyId: profile.company_id });

        if (companyData) {
          setCompany(companyData);
          setCompanyName(companyData.name);

          // Load members
          const { data: membersData, error: membersError } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, avatar_url, city')
            .eq('company_id', profile.company_id);

          console.log('Members fetch result:', { membersData, membersError });
          setMembers(membersData || []);
        }
      }

      // Load registration codes for this company
      if (profile?.company_id) {
        const { data: codesData } = await supabase
          .from('registration_codes')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false });

        setCodes(codesData || []);
      } else {
        // If no company yet, load all codes the manager can see
        const { data: codesData } = await supabase
          .from('registration_codes')
          .select('*')
          .order('created_at', { ascending: false });

        setCodes(codesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCompany = async () => {
    if (!companyName.trim()) {
      toast({ title: 'Erro', description: 'Digite o nome da empresa', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      // Create company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName.trim() })
        .select()
        .single();

      if (companyError) throw companyError;

      // Upsert profile with company_id (create if doesn't exist, update if exists)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: user!.id, 
          company_id: newCompany.id,
          full_name: user!.email?.split('@')[0] || 'Gestor RH'
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (profileError) throw profileError;

      setCompany(newCompany);
      toast({ title: 'Sucesso', description: 'Comunidade criada!' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

const generateCode = async (role: 'expatriate' | 'manager' | 'community_member') => { // 'expatriate' = premium_company in DB enum
    if (!company) {
      toast({ title: 'Erro', description: 'Crie uma comunidade primeiro', variant: 'destructive' });
      return;
    }

    try {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const arr = new Uint8Array(8);
      crypto.getRandomValues(arr);
      const code = Array.from(arr, b => chars[b % chars.length]).join('');
      
      const { error } = await supabase
        .from('registration_codes')
        .insert({
          code,
          role: role === 'community_member' ? 'expatriate' : role,
          max_uses: codeQuantity > 0 ? codeQuantity : null,
          is_active: true,
          company_id: company.id
        } as any);

      if (error) throw error;

      toast({ title: 'Código gerado', description: `Código: ${code} (${codeQuantity > 0 ? codeQuantity : '∞'} usos)` });
      setCodeQuantity(1);
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const removeMember = async (member: CommunityMember) => {
    try {
      console.log('Removing member:', member);
      
      // Use user_id instead of profile id for more reliable update
      const { error, count } = await supabase
        .from('profiles')
        .update({ company_id: null })
        .eq('user_id', member.user_id);

      console.log('Remove result:', { error, count });

      if (error) throw error;

      toast({ title: 'Membro removido da comunidade' });
      loadData();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copiado!', description: 'Código copiado para a área de transferência' });
  };

  const deactivateCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('registration_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) throw error;

      toast({ title: 'Código desativado' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !company) return;

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${company.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', company.id);

      if (updateError) throw updateError;

      setCompany({ ...company, logo_url: publicUrl });
      toast({ title: 'Logo atualizado!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Community / Company
          </CardTitle>
          <CardDescription>
            Manage your company community
          </CardDescription>
        </CardHeader>
        <CardContent>
          {company ? (
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={logoInputRef}
                onChange={uploadLogo}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="relative h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden group hover:ring-2 hover:ring-primary/50 transition-all"
              >
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploadingLogo ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
              </button>
              <div>
                <h3 className="text-xl font-bold">{company.name}</h3>
                <p className="text-sm text-muted-foreground">{members.length} members</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Create a community for your team
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Company/community name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <Button onClick={createCompany} disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Invite Links */}
      <CommunityLinkManager companyId={company?.id || null} />

      {/* Registration Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Codes</CardTitle>
          <CardDescription>
            Generate codes to invite members to your community (for full app access)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Number of uses</Label>
              <Input
                type="number"
                min={1}
                max={999}
                value={codeQuantity}
                onChange={(e) => setCodeQuantity(parseInt(e.target.value) || 1)}
                className="w-20"
              />
            </div>
            <Button onClick={() => generateCode('expatriate')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Premium Company
            </Button>
            <Button onClick={() => generateCode('community_member')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Community Member
            </Button>
            <Button onClick={() => generateCode('manager')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              HR Manager
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Premium Company:</strong> Full app access | <strong>Community:</strong> Community only | <strong>Manager:</strong> HR Panel
          </p>

          {codes.length > 0 && (
            <div className="space-y-2">
              <Label>Active Codes</Label>
              <div className="space-y-2">
                {codes.filter(c => c.is_active).map((code) => (
                  <div key={code.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-lg font-bold">{code.code}</code>
                      <Badge variant={code.role === 'manager' ? 'default' : 'secondary'}>
                        {code.role === 'manager' ? 'Manager' : code.role === 'community_member' ? 'Community' : 'Premium Company'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {code.current_uses}/{code.max_uses || '∞'} uses
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => copyCode(code.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deactivateCode(code.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No members yet. Share an invite code or link!
              </p>
            ) : (
              <div className="grid gap-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        {member.city && (
                          <p className="text-sm text-muted-foreground">{member.city}</p>
                        )}
                      </div>
                    </div>
                    {member.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
