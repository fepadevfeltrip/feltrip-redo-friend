import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Building2, Clock, FileText, Save, Loader2, Infinity } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  studio_minutes_limit: number;
  mrp_monthly_limit: number | null;
}

export function CompanyLimitsManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedLimits, setEditedLimits] = useState<Record<string, { studio: number; mrp: number | null; unlimitedMrp: boolean }>>({});

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, studio_minutes_limit, mrp_monthly_limit')
      .order('name');

    if (error) {
      console.error('Error fetching companies:', error);
      return;
    }

    setCompanies(data || []);
    
    // Initialize edited limits
    const limits: Record<string, { studio: number; mrp: number | null; unlimitedMrp: boolean }> = {};
    data?.forEach(c => {
      limits[c.id] = {
        studio: c.studio_minutes_limit || 240,
        mrp: c.mrp_monthly_limit,
        unlimitedMrp: c.mrp_monthly_limit === null
      };
    });
    setEditedLimits(limits);
    setIsLoading(false);
  };

  const handleSave = async (companyId: string) => {
    const limits = editedLimits[companyId];
    if (!limits) return;

    setSaving(companyId);

    const { error } = await supabase
      .from('companies')
      .update({
        studio_minutes_limit: limits.studio,
        mrp_monthly_limit: limits.unlimitedMrp ? null : limits.mrp
      })
      .eq('id', companyId);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Limites atualizados',
        description: 'Os limites da empresa foram salvos com sucesso.'
      });
      fetchCompanies();
    }

    setSaving(null);
  };

  const updateLimit = (companyId: string, field: 'studio' | 'mrp' | 'unlimitedMrp', value: number | boolean) => {
    setEditedLimits(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Limites por Empresa</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map(company => {
          const limits = editedLimits[company.id];
          if (!limits) return null;

          return (
            <Card key={company.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {company.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Studio Minutes Limit */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Language Studio (min/mês)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={limits.studio}
                    onChange={(e) => updateLimit(company.id, 'studio', parseInt(e.target.value) || 0)}
                    className="h-9"
                  />
                </div>

                {/* MRP Monthly Limit */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-green-500" />
                    MRP (questionários/mês)
                  </Label>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Switch
                      checked={limits.unlimitedMrp}
                      onCheckedChange={(checked) => updateLimit(company.id, 'unlimitedMrp', checked)}
                    />
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Infinity className="h-4 w-4" />
                      Ilimitado
                    </span>
                  </div>

                  {!limits.unlimitedMrp && (
                    <Input
                      type="number"
                      min={1}
                      value={limits.mrp || 2}
                      onChange={(e) => updateLimit(company.id, 'mrp', parseInt(e.target.value) || 2)}
                      className="h-9"
                    />
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleSave(company.id)}
                  disabled={saving === company.id}
                >
                  {saving === company.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
