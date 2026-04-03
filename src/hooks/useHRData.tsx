import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CollaboratorData {
  userId: string;
  fullName: string;
  city: string;
  body: number;
  space: number;
  territory: number;
  other: number;
  identity: number;
  questionnaireType: string;
  sharedAt: string;
}

interface WorkplaceData {
  userId: string;
  fullName: string;
  space: number;
  body: number;
  other: number;
  culture: number;
  belonging: number;
  responsibility: number;
  poeticResponse: string | null;
  sharedAt: string;
}

interface EngagementData {
  userId: string;
  fullName: string;
  languagePractice: number;
  securityMap: number;
  presenceQuestionnaire: number;
  totalEngagement: number;
}

interface SafetyMapPin {
  id: string;
  userId: string;
  fullName: string;
  city: string;
  title: string;
  content: string | null;
  type: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

interface HRDashboardData {
  collaborators: CollaboratorData[];
  workplaceData: WorkplaceData[];
  engagement: EngagementData[];
  safetyMapPins: SafetyMapPin[];
  averageScores: {
    body: number;
    space: number;
    territory: number;
    other: number;
    identity: number;
  };
  workplaceAverages: {
    space: number;
    body: number;
    other: number;
    culture: number;
    belonging: number;
    responsibility: number;
  };
  languageEngagementPercentage: number;
  totalCollaborators: number;
  totalEngagement: number;
  isLoading: boolean;
}

export function useHRData(): HRDashboardData {
  const [collaborators, setCollaborators] = useState<CollaboratorData[]>([]);
  const [workplaceData, setWorkplaceData] = useState<WorkplaceData[]>([]);
  const [engagement, setEngagement] = useState<EngagementData[]>([]);
  const [safetyMapPins, setSafetyMapPins] = useState<SafetyMapPin[]>([]);
  const [languageEngagementPercentage, setLanguageEngagementPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch profiles for collaborators first
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, city');

        const profileMap = new Map(profiles?.map(p => [p.user_id, { name: p.full_name, city: p.city || '' }]) || []);

        // Fetch shared HR data for personal questionnaires
        const { data: sharedData } = await supabase
          .from('hr_shared_data')
          .select('*')
          .order('shared_at', { ascending: false });

        // Fetch workplace HR shared data (separate table)
        const { data: workplaceSharedData } = await (supabase as any)
          .from('workplace_hr_shared_data')
          .select('*')
          .order('shared_at', { ascending: false });

        // Process personal questionnaires
        const personalData: CollaboratorData[] = (sharedData || []).map(d => {
          const profile = profileMap.get(d.user_id);
          return {
            userId: d.user_id,
            fullName: profile?.name || 'Collaborator',
            city: profile?.city || '',
            body: d.body_score,
            space: d.space_score,
            territory: d.territory_score,
            other: d.other_score,
            identity: d.identity_score,
            questionnaireType: d.questionnaire_type,
            sharedAt: d.shared_at
          };
        });

        // Process workplace questionnaires from dedicated table
        const workplaceResults: WorkplaceData[] = ((workplaceSharedData || []) as any[]).map((d: any) => {
          const profile = profileMap.get(d.user_id);
          return {
            userId: d.user_id,
            fullName: profile?.name || 'Collaborator',
            space: d.space_score,
            body: d.body_score,
            other: d.other_score,
            culture: d.culture_score,
            belonging: d.belonging_score,
            responsibility: d.responsibility_score,
            poeticResponse: d.poetic_response,
            sharedAt: d.shared_at
          };
        });

        setCollaborators(personalData);
        setWorkplaceData(workplaceResults);

        // Fetch map pins with collaborator names (managers can see all)
        const { data: mapPinsData } = await supabase
          .from('map_pins')
          .select('*')
          .order('created_at', { ascending: false });

        const mapPins: SafetyMapPin[] = (mapPinsData || []).map(pin => {
          const profile = profileMap.get(pin.user_id);
          return {
            id: pin.id,
            userId: pin.user_id,
            fullName: profile?.name || 'Collaborator',
            city: profile?.city || '',
            title: pin.title,
            content: pin.content,
            type: pin.type,
            latitude: pin.latitude,
            longitude: pin.longitude,
            createdAt: pin.created_at
          };
        });

        setSafetyMapPins(mapPins);

        // Fetch engagement data
        const { data: engagementData } = await supabase
          .from('engagement_tracking')
          .select('user_id, activity_type, activity_date');

        // Group engagement by user
        const engagementByUser = new Map<string, { language: number; security: number; questionnaire: number }>();
        let totalLanguageOpens = 0;
        const uniqueLanguageUsers = new Set<string>();
        
        (engagementData || []).forEach(e => {
          if (!engagementByUser.has(e.user_id)) {
            engagementByUser.set(e.user_id, { language: 0, security: 0, questionnaire: 0 });
          }
          const userData = engagementByUser.get(e.user_id)!;
          
          // Track both old and new activity types for language practice
          if (e.activity_type === 'language_practice' || e.activity_type === 'language_practice_open') {
            userData.language++;
            totalLanguageOpens++;
            uniqueLanguageUsers.add(e.user_id);
          }
          if (e.activity_type === 'security_map') userData.security++;
          if (e.activity_type === 'presence_questionnaire') userData.questionnaire++;
        });

        const engagementResults: EngagementData[] = Array.from(engagementByUser.entries()).map(([userId, data]) => {
          const profile = profileMap.get(userId);
          return {
            userId,
            fullName: profile?.name || 'Visitante Curioso',
            languagePractice: data.language,
            securityMap: data.security,
            presenceQuestionnaire: data.questionnaire,
            totalEngagement: data.language + data.security + data.questionnaire
          };
        });

        setEngagement(engagementResults);

        // Calculate language engagement percentage (anonymous - just percentages)
        const totalUsers = profiles?.length || 1;
        const languagePercentage = Math.round((uniqueLanguageUsers.size / totalUsers) * 100);
        setLanguageEngagementPercentage(languagePercentage);

      } catch (error) {
        console.error('Error fetching HR data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate averages for personal questionnaire
  const averageScores = collaborators.length > 0 ? {
    body: Math.round(collaborators.reduce((sum, e) => sum + e.body, 0) / collaborators.length),
    space: Math.round(collaborators.reduce((sum, e) => sum + e.space, 0) / collaborators.length),
    territory: Math.round(collaborators.reduce((sum, e) => sum + e.territory, 0) / collaborators.length),
    other: Math.round(collaborators.reduce((sum, e) => sum + e.other, 0) / collaborators.length),
    identity: Math.round(collaborators.reduce((sum, e) => sum + e.identity, 0) / collaborators.length)
  } : { body: 0, space: 0, territory: 0, other: 0, identity: 0 };

  // Calculate averages for workplace questionnaire
  const workplaceAverages = workplaceData.length > 0 ? {
    space: Math.round(workplaceData.reduce((sum, e) => sum + e.space, 0) / workplaceData.length),
    body: Math.round(workplaceData.reduce((sum, e) => sum + e.body, 0) / workplaceData.length),
    other: Math.round(workplaceData.reduce((sum, e) => sum + e.other, 0) / workplaceData.length),
    culture: Math.round(workplaceData.reduce((sum, e) => sum + e.culture, 0) / workplaceData.length),
    belonging: Math.round(workplaceData.reduce((sum, e) => sum + e.belonging, 0) / workplaceData.length),
    responsibility: Math.round(workplaceData.reduce((sum, e) => sum + e.responsibility, 0) / workplaceData.length)
  } : { space: 0, body: 0, other: 0, culture: 0, belonging: 0, responsibility: 0 };

  const totalEngagement = engagement.reduce((sum, e) => sum + e.totalEngagement, 0);

  return {
    collaborators,
    workplaceData,
    engagement,
    safetyMapPins,
    averageScores,
    workplaceAverages,
    languageEngagementPercentage,
    totalCollaborators: new Set(collaborators.map(e => e.userId)).size,
    totalEngagement,
    isLoading
  };
}
