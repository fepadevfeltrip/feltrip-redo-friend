import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyStats {
  companyId: string;
  companyName: string;
  totalUsers: number;
  activeUsers: number;
  aiMinutesUsed: number;
  aiMinutesLimit: number;
  totalEngagement: number;
  languagePractice: number;
  mapPins: number;
  questionnaires: number;
}

interface GlobalStats {
  totalCompanies: number;
  totalUsers: number;
  totalAIMinutesUsed: number;
  totalEngagement: number;
  totalMapPins: number;
  totalQuestionnaires: number;
}

interface OwnerData {
  companyStats: CompanyStats[];
  globalStats: GlobalStats;
  isLoading: boolean;
}

export function useOwnerData(): OwnerData {
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalCompanies: 0,
    totalUsers: 0,
    totalAIMinutesUsed: 0,
    totalEngagement: 0,
    totalMapPins: 0,
    totalQuestionnaires: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all companies
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name');

        // Fetch all profiles with company
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, company_id, full_name');

        // Fetch all user usage data
        const { data: usageData } = await supabase
          .from('user_usage')
          .select('user_id, minutes_used_this_month, monthly_limit_minutes');

        // Fetch all engagement data
        const { data: engagementData } = await supabase
          .from('engagement_tracking')
          .select('user_id, activity_type');

        // Fetch all map pins
        const { data: mapPins } = await supabase
          .from('map_pins')
          .select('user_id');

        // Fetch all questionnaires
        const { data: questionnaires } = await supabase
          .from('presence_questionnaires')
          .select('user_id');

        // Create maps for quick lookup
        const profilesByCompany = new Map<string, string[]>();
        profiles?.forEach(p => {
          if (p.company_id) {
            if (!profilesByCompany.has(p.company_id)) {
              profilesByCompany.set(p.company_id, []);
            }
            profilesByCompany.get(p.company_id)!.push(p.user_id);
          }
        });

        const usageByUser = new Map(usageData?.map(u => [u.user_id, u]) || []);
        
        // Count engagement by user
        const engagementByUser = new Map<string, { total: number; language: number }>();
        engagementData?.forEach(e => {
          if (!engagementByUser.has(e.user_id)) {
            engagementByUser.set(e.user_id, { total: 0, language: 0 });
          }
          const data = engagementByUser.get(e.user_id)!;
          data.total++;
          if (e.activity_type === 'language_practice' || e.activity_type === 'language_practice_open') {
            data.language++;
          }
        });

        // Count map pins by user
        const mapPinsByUser = new Map<string, number>();
        mapPins?.forEach(p => {
          mapPinsByUser.set(p.user_id, (mapPinsByUser.get(p.user_id) || 0) + 1);
        });

        // Count questionnaires by user
        const questionnairesByUser = new Map<string, number>();
        questionnaires?.forEach(q => {
          questionnairesByUser.set(q.user_id, (questionnairesByUser.get(q.user_id) || 0) + 1);
        });

        // Calculate stats per company
        const stats: CompanyStats[] = (companies || []).map(company => {
          const companyUsers = profilesByCompany.get(company.id) || [];
          
          let aiMinutesUsed = 0;
          let aiMinutesLimit = 0;
          let totalEngagement = 0;
          let languagePractice = 0;
          let mapPinsCount = 0;
          let questionnairesCount = 0;

          companyUsers.forEach(userId => {
            const usage = usageByUser.get(userId);
            if (usage) {
              aiMinutesUsed += usage.minutes_used_this_month || 0;
              aiMinutesLimit += usage.monthly_limit_minutes || 0;
            }

            const engagement = engagementByUser.get(userId);
            if (engagement) {
              totalEngagement += engagement.total;
              languagePractice += engagement.language;
            }

            mapPinsCount += mapPinsByUser.get(userId) || 0;
            questionnairesCount += questionnairesByUser.get(userId) || 0;
          });

          return {
            companyId: company.id,
            companyName: company.name,
            totalUsers: companyUsers.length,
            activeUsers: companyUsers.filter(u => engagementByUser.has(u)).length,
            aiMinutesUsed,
            aiMinutesLimit,
            totalEngagement,
            languagePractice,
            mapPins: mapPinsCount,
            questionnaires: questionnairesCount
          };
        });

        setCompanyStats(stats);

        // Calculate global stats
        setGlobalStats({
          totalCompanies: companies?.length || 0,
          totalUsers: profiles?.length || 0,
          totalAIMinutesUsed: stats.reduce((sum, s) => sum + s.aiMinutesUsed, 0),
          totalEngagement: stats.reduce((sum, s) => sum + s.totalEngagement, 0),
          totalMapPins: mapPins?.length || 0,
          totalQuestionnaires: questionnaires?.length || 0
        });

      } catch (error) {
        console.error('Error fetching owner data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    companyStats,
    globalStats,
    isLoading
  };
}
