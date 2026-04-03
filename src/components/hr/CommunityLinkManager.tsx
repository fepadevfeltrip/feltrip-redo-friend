import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link as LinkIcon, Copy, Trash2, Plus, ExternalLink, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface InviteLink {
  id: string;
  slug: string;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  created_at: string;
}

interface CommunityLinkManagerProps {
  companyId: string | null;
}

export function CommunityLinkManager({ companyId }: CommunityLinkManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<InviteLink[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [maxUses, setMaxUses] = useState<number>(0);

  useEffect(() => {
    if (companyId) {
      loadCompanyName().then(() => {
        loadLinks();
      });
    }
  }, [companyId]);

  const loadCompanyName = async () => {
    if (!companyId) return;
    
    const { data } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();
    
    if (data?.name) {
      setCompanyName(data.name);
      return data.name;
    }
    return null;
  };

  const loadLinks = async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_invite_links')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error('Error loading links:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a slug with company name + random suffix for uniqueness
  const generateSlug = (name: string) => {
    const normalized = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
      .substring(0, 20); // Limit length
    
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const randomSuffix = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${normalized}-community-${randomSuffix}`;
  };

  const createLink = async () => {
    if (!companyId || !user) {
      toast({ title: 'Error', description: 'No company found', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      const slug = generateSlug(companyName || 'community');
      
      const { error } = await supabase
        .from('community_invite_links')
        .insert({
          company_id: companyId,
          created_by: user.id,
          slug,
          max_uses: maxUses > 0 ? maxUses : null,
          is_active: true
        });

      if (error) throw error;

      toast({ title: 'Link created', description: 'Community invite link has been created' });
      setMaxUses(0);
      loadLinks();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const APP_DOMAIN = 'https://platform.feltrip.com';

  const copyLink = (slug: string) => {
    const fullUrl = `${APP_DOMAIN}/join/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  };

  const deactivateLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('community_invite_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) throw error;

      toast({ title: 'Link deactivated' });
      loadLinks();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getFullUrl = (slug: string) => {
    return `${APP_DOMAIN}/join/${slug}`;
  };

  if (!companyId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Community Invite Links
        </CardTitle>
        <CardDescription>
          Create public links for external guests to join your community without a code. 
          They will only have access to the community features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create New Link */}
        <div className="flex items-end gap-3 flex-wrap p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label className="text-xs">Max uses (0 = unlimited)</Label>
            <Input
              type="number"
              min={0}
              max={9999}
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value) || 0)}
              className="w-24"
              disabled={isCreating}
            />
          </div>
          <Button onClick={createLink} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Generate Link
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Users who join via link will be assigned the "Community Member" role with access only to the community map, feed, and events.
        </p>

        {/* Links List */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : links.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No invite links created yet. Generate one to share with external guests.
          </p>
        ) : (
          <div className="space-y-2">
            <Label>Active Links</Label>
            {links.map((link) => (
              <div
                key={link.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  link.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">
                      /join/{link.slug}
                    </code>
                    <Badge variant={link.is_active ? 'default' : 'secondary'}>
                      {link.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {link.current_uses}/{link.max_uses || '∞'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {getFullUrl(link.slug)}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyLink(link.slug)}
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(getFullUrl(link.slug), '_blank')}
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {link.is_active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deactivateLink(link.id)}
                      title="Deactivate"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}