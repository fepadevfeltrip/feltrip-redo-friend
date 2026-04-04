export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliates: {
        Row: {
          comission: number | null
          created_at: string
          id: number
          name: string | null
          slug: string | null
          payment_account_id: string | null
          "user id": string | null
        }
        Insert: {
          comission?: number | null
          created_at?: string
          id?: number
          name?: string | null
          slug?: string | null
          payment_account_id?: string | null
          "user id"?: string | null
        }
        Update: {
          comission?: number | null
          created_at?: string
          id?: number
          name?: string | null
          slug?: string | null
          payment_account_id?: string | null
          "user id"?: string | null
        }
        Relationships: []
      }
      chat_access: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          plan_type: string
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          plan_type?: string
          starts_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          plan_type?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      city_questionnaires: {
        Row: {
          body_q1: number
          body_q2: number
          body_q3: number
          body_q4: number
          city: string
          created_at: string
          gender: string | null
          generation: string | null
          id: string
          identity_q1: number
          identity_q2: number
          identity_q3: number
          identity_q4: number
          journey_identities: string[] | null
          map_content: string | null
          map_status: string
          other_q1: number
          other_q2: number
          other_q3: number
          other_q4: number
          purchasing_power: string
          space_q1: number
          space_q2: number
          space_q3: number
          space_q4: number
          stay_duration: string
          territory_q1: number
          territory_q2: number
          territory_q3: number
          territory_q4: number
          updated_at: string
          user_id: string
        }
        Insert: {
          body_q1: number
          body_q2: number
          body_q3: number
          body_q4: number
          city: string
          created_at?: string
          gender?: string | null
          generation?: string | null
          id?: string
          identity_q1: number
          identity_q2: number
          identity_q3: number
          identity_q4: number
          journey_identities?: string[] | null
          map_content?: string | null
          map_status?: string
          other_q1: number
          other_q2: number
          other_q3: number
          other_q4: number
          purchasing_power?: string
          space_q1: number
          space_q2: number
          space_q3: number
          space_q4: number
          stay_duration: string
          territory_q1: number
          territory_q2: number
          territory_q3: number
          territory_q4: number
          updated_at?: string
          user_id: string
        }
        Update: {
          body_q1?: number
          body_q2?: number
          body_q3?: number
          body_q4?: number
          city?: string
          created_at?: string
          gender?: string | null
          generation?: string | null
          id?: string
          identity_q1?: number
          identity_q2?: number
          identity_q3?: number
          identity_q4?: number
          journey_identities?: string[] | null
          map_content?: string | null
          map_status?: string
          other_q1?: number
          other_q2?: number
          other_q3?: number
          other_q4?: number
          purchasing_power?: string
          space_q1?: number
          space_q2?: number
          space_q3?: number
          space_q4?: number
          stay_duration?: string
          territory_q1?: number
          territory_q2?: number
          territory_q3?: number
          territory_q4?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_events: {
        Row: {
          created_at: string
          description: string | null
          description_encrypted: string | null
          event_date: string
          id: string
          image_url: string | null
          is_encrypted: boolean | null
          is_online: boolean
          location: string | null
          location_encrypted: string | null
          max_participants: number | null
          meeting_link: string | null
          title: string
          title_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_encrypted?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_encrypted?: boolean | null
          is_online?: boolean
          location?: string | null
          location_encrypted?: string | null
          max_participants?: number | null
          meeting_link?: string | null
          title: string
          title_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_encrypted?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_encrypted?: boolean | null
          is_online?: boolean
          location?: string | null
          location_encrypted?: string | null
          max_participants?: number | null
          meeting_link?: string | null
          title?: string
          title_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_group_posts: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      community_invite_links: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_invite_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          content_encrypted: string | null
          created_at: string
          id: string
          image_url: string | null
          is_encrypted: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_encrypted?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_encrypted?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_encrypted?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_encrypted?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          mrp_monthly_limit: number | null
          name: string
          studio_minutes_limit: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          mrp_monthly_limit?: number | null
          name: string
          studio_minutes_limit?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          mrp_monthly_limit?: number | null
          name?: string
          studio_minutes_limit?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      concierge_experts: {
        Row: {
          avatar_url: string | null
          avg_rating: number
          bio: string | null
          bio_en: string | null
          bio_es: string | null
          categories: string[] | null
          city: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          instagram: string | null
          is_active: boolean
          is_community_verified: boolean
          is_cult_approved: boolean
          is_feltrip_indicated: boolean
          languages: string[] | null
          phone: string | null
          slug: string | null
          specialty: string
          total_reviews: number
          updated_at: string
          verification_date: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          avg_rating?: number
          bio?: string | null
          bio_en?: string | null
          bio_es?: string | null
          categories?: string[] | null
          city: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_community_verified?: boolean
          is_cult_approved?: boolean
          is_feltrip_indicated?: boolean
          languages?: string[] | null
          phone?: string | null
          slug?: string | null
          specialty: string
          total_reviews?: number
          updated_at?: string
          verification_date?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          avg_rating?: number
          bio?: string | null
          bio_en?: string | null
          bio_es?: string | null
          categories?: string[] | null
          city?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_community_verified?: boolean
          is_cult_approved?: boolean
          is_feltrip_indicated?: boolean
          languages?: string[] | null
          phone?: string | null
          slug?: string | null
          specialty?: string
          total_reviews?: number
          updated_at?: string
          verification_date?: string | null
          website?: string | null
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          created_at: string
          id: string
          is_encrypted: boolean | null
          note: string | null
          note_encrypted: string | null
          pillar: string
          sentiment: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          note?: string | null
          note_encrypted?: string | null
          pillar: string
          sentiment: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          note?: string | null
          note_encrypted?: string | null
          pillar?: string
          sentiment?: number
          user_id?: string
        }
        Relationships: []
      }
      engagement_tracking: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      expert_referrals: {
        Row: {
          created_at: string
          expert_id: string
          id: string
          is_verified: boolean
          referral_note: string | null
          referrer_email: string | null
          referrer_name: string
          referrer_type: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expert_id: string
          id?: string
          is_verified?: boolean
          referral_note?: string | null
          referrer_email?: string | null
          referrer_name: string
          referrer_type?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expert_id?: string
          id?: string
          is_verified?: boolean
          referral_note?: string | null
          referrer_email?: string | null
          referrer_name?: string
          referrer_type?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_referrals_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "concierge_experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_referrals_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "concierge_experts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_reviews: {
        Row: {
          comment: string | null
          created_at: string
          expert_id: string
          id: string
          is_public: boolean
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          expert_id: string
          id?: string
          is_public?: boolean
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          expert_id?: string
          id?: string
          is_public?: boolean
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_reviews_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "concierge_experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_reviews_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "concierge_experts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      housing_responses: {
        Row: {
          analise_poetica: string | null
          answer_corpo: string | null
          answer_espaco: string | null
          answer_identidade: string | null
          answer_outro: string | null
          answer_territorio: string | null
          bairros_sugeridos: Json | null
          city: string
          client_name: string
          created_at: string
          fechamento: string | null
          id: string
          perfil_resumido: string | null
          pilar_corpo: string | null
          pilar_espaco: string | null
          pilar_identidade: string | null
          pilar_outro: string | null
          pilar_territorio: string | null
          user_id: string
        }
        Insert: {
          analise_poetica?: string | null
          answer_corpo?: string | null
          answer_espaco?: string | null
          answer_identidade?: string | null
          answer_outro?: string | null
          answer_territorio?: string | null
          bairros_sugeridos?: Json | null
          city: string
          client_name?: string
          created_at?: string
          fechamento?: string | null
          id?: string
          perfil_resumido?: string | null
          pilar_corpo?: string | null
          pilar_espaco?: string | null
          pilar_identidade?: string | null
          pilar_outro?: string | null
          pilar_territorio?: string | null
          user_id: string
        }
        Update: {
          analise_poetica?: string | null
          answer_corpo?: string | null
          answer_espaco?: string | null
          answer_identidade?: string | null
          answer_outro?: string | null
          answer_territorio?: string | null
          bairros_sugeridos?: Json | null
          city?: string
          client_name?: string
          created_at?: string
          fechamento?: string | null
          id?: string
          perfil_resumido?: string | null
          pilar_corpo?: string | null
          pilar_espaco?: string | null
          pilar_identidade?: string | null
          pilar_outro?: string | null
          pilar_territorio?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hr_shared_data: {
        Row: {
          body_score: number
          id: string
          identity_score: number
          other_score: number
          poetic_response: string | null
          questionnaire_id: string
          questionnaire_type: string
          responsibility_score: number | null
          shared_at: string
          space_score: number
          territory_score: number
          user_id: string
        }
        Insert: {
          body_score: number
          id?: string
          identity_score: number
          other_score: number
          poetic_response?: string | null
          questionnaire_id: string
          questionnaire_type: string
          responsibility_score?: number | null
          shared_at?: string
          space_score: number
          territory_score: number
          user_id: string
        }
        Update: {
          body_score?: number
          id?: string
          identity_score?: number
          other_score?: number
          poetic_response?: string | null
          questionnaire_id?: string
          questionnaire_type?: string
          responsibility_score?: number | null
          shared_at?: string
          space_score?: number
          territory_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_shared_data_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: true
            referencedRelation: "presence_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      institutional_squads: {
        Row: {
          created_at: string
          domain: string
          id: string
          institution_name: string | null
          institutional_email: string
          position: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          institution_name?: string | null
          institutional_email: string
          position?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          institution_name?: string | null
          institutional_email?: string
          position?: string | null
          user_id?: string
        }
        Relationships: []
      }
      internal_service_requests: {
        Row: {
          created_at: string
          expatriate_name: string
          id: string
          notes: string | null
          rating: number | null
          service_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expatriate_name: string
          id?: string
          notes?: string | null
          rating?: number | null
          service_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expatriate_name?: string
          id?: string
          notes?: string | null
          rating?: number | null
          service_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      language_practice: {
        Row: {
          conversation: Json
          created_at: string
          id: string
          language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation?: Json
          created_at?: string
          id?: string
          language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation?: Json
          created_at?: string
          id?: string
          language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      language_studio_subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          minutes_used_this_week: number
          starts_at: string
          payment_payment_id: string | null
          updated_at: string
          user_id: string
          week_reset_at: string
          weekly_minutes_limit: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          minutes_used_this_week?: number
          starts_at?: string
          payment_payment_id?: string | null
          updated_at?: string
          user_id: string
          week_reset_at?: string
          weekly_minutes_limit?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          minutes_used_this_week?: number
          starts_at?: string
          payment_payment_id?: string | null
          updated_at?: string
          user_id?: string
          week_reset_at?: string
          weekly_minutes_limit?: number
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          type: string
          updated_at?: string
          version?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      map_pin_comments: {
        Row: {
          content: string
          content_encrypted: string | null
          created_at: string
          id: string
          is_encrypted: boolean | null
          map_pin_id: string
          user_id: string
        }
        Insert: {
          content: string
          content_encrypted?: string | null
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          map_pin_id: string
          user_id: string
        }
        Update: {
          content?: string
          content_encrypted?: string | null
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          map_pin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_pin_comments_map_pin_id_fkey"
            columns: ["map_pin_id"]
            isOneToOne: false
            referencedRelation: "map_pins"
            referencedColumns: ["id"]
          },
        ]
      }
      map_pin_likes: {
        Row: {
          created_at: string
          id: string
          map_pin_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          map_pin_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          map_pin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_pin_likes_map_pin_id_fkey"
            columns: ["map_pin_id"]
            isOneToOne: false
            referencedRelation: "map_pins"
            referencedColumns: ["id"]
          },
        ]
      }
      map_pins: {
        Row: {
          audio_url: string | null
          content: string | null
          content_encrypted: string | null
          created_at: string
          id: string
          image_url: string | null
          is_encrypted: boolean | null
          is_shared_to_community: boolean
          is_shared_with_hr: boolean
          latitude: number
          longitude: number
          title: string
          title_encrypted: string | null
          type: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          content_encrypted?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_encrypted?: boolean | null
          is_shared_to_community?: boolean
          is_shared_with_hr?: boolean
          latitude: number
          longitude: number
          title: string
          title_encrypted?: string | null
          type: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          content_encrypted?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_encrypted?: boolean | null
          is_shared_to_community?: boolean
          is_shared_with_hr?: boolean
          latitude?: number
          longitude?: number
          title?: string
          title_encrypted?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      map_purchases: {
        Row: {
          city: string | null
          created_at: string
          id: string
          purchase_type: string
          payment_payment_id: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          purchase_type?: string
          payment_payment_id?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          purchase_type?: string
          payment_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mrp_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          session_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          session_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mrp_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mrp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mrp_gems: {
        Row: {
          acesso: string | null
          address: string | null
          camada_emocional: string[] | null
          categoria_principal: string | null
          cidade: string | null
          created_at: string
          description: string | null
          dna_criativo: number | null
          dna_cult: number | null
          dna_espiritual: number | null
          dna_luxo: number | null
          dna_raiz: number | null
          expira_em: string | null
          id: string
          is_carnaval: boolean | null
          lat: number | null
          lng: number | null
          movimento: string | null
          name: string
          pin_color: string | null
          proposicao_poetica: string | null
          session_id: string | null
          turno_ideal: string | null
          user_id: string | null
        }
        Insert: {
          acesso?: string | null
          address?: string | null
          camada_emocional?: string[] | null
          categoria_principal?: string | null
          cidade?: string | null
          created_at?: string
          description?: string | null
          dna_criativo?: number | null
          dna_cult?: number | null
          dna_espiritual?: number | null
          dna_luxo?: number | null
          dna_raiz?: number | null
          expira_em?: string | null
          id?: string
          is_carnaval?: boolean | null
          lat?: number | null
          lng?: number | null
          movimento?: string | null
          name?: string
          pin_color?: string | null
          proposicao_poetica?: string | null
          session_id?: string | null
          turno_ideal?: string | null
          user_id?: string | null
        }
        Update: {
          acesso?: string | null
          address?: string | null
          camada_emocional?: string[] | null
          categoria_principal?: string | null
          cidade?: string | null
          created_at?: string
          description?: string | null
          dna_criativo?: number | null
          dna_cult?: number | null
          dna_espiritual?: number | null
          dna_luxo?: number | null
          dna_raiz?: number | null
          expira_em?: string | null
          id?: string
          is_carnaval?: boolean | null
          lat?: number | null
          lng?: number | null
          movimento?: string | null
          name?: string
          pin_color?: string | null
          proposicao_poetica?: string | null
          session_id?: string | null
          turno_ideal?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mrp_gems_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mrp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mrp_sessions: {
        Row: {
          city: string | null
          created_at: string
          emotional_status: string | null
          id: string
          is_public: boolean | null
          language: string | null
          poetic_proposition: string | null
          portal: string | null
          profile: string | null
          scores: Json
          user_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          emotional_status?: string | null
          id?: string
          is_public?: boolean | null
          language?: string | null
          poetic_proposition?: string | null
          portal?: string | null
          profile?: string | null
          scores?: Json
          user_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          emotional_status?: string | null
          id?: string
          is_public?: boolean | null
          language?: string | null
          poetic_proposition?: string | null
          portal?: string | null
          profile?: string | null
          scores?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          client_name: string | null
          created_at: string
          email_notifications: boolean
          id: string
          push_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      presence_questionnaires: {
        Row: {
          body_q1: number
          body_q2: number
          body_q3: number
          created_at: string
          id: string
          identity_q1: number
          identity_q2: number
          identity_q3: number
          is_encrypted: boolean | null
          other_q1: number
          other_q2: number
          other_q3: number
          poetic_response: string | null
          poetic_response_encrypted: string | null
          questionnaire_type: string
          responsibility_q1: number | null
          responsibility_q2: number | null
          responsibility_q3: number | null
          responsibility_q4: number | null
          responsibility_q5: number | null
          share_with_workplace: boolean
          space_q1: number
          space_q2: number
          space_q3: number
          territory_q1: number
          territory_q2: number
          territory_q3: number
          user_id: string
        }
        Insert: {
          body_q1: number
          body_q2: number
          body_q3: number
          created_at?: string
          id?: string
          identity_q1: number
          identity_q2: number
          identity_q3: number
          is_encrypted?: boolean | null
          other_q1: number
          other_q2: number
          other_q3: number
          poetic_response?: string | null
          poetic_response_encrypted?: string | null
          questionnaire_type: string
          responsibility_q1?: number | null
          responsibility_q2?: number | null
          responsibility_q3?: number | null
          responsibility_q4?: number | null
          responsibility_q5?: number | null
          share_with_workplace?: boolean
          space_q1: number
          space_q2: number
          space_q3: number
          territory_q1: number
          territory_q2: number
          territory_q3: number
          user_id: string
        }
        Update: {
          body_q1?: number
          body_q2?: number
          body_q3?: number
          created_at?: string
          id?: string
          identity_q1?: number
          identity_q2?: number
          identity_q3?: number
          is_encrypted?: boolean | null
          other_q1?: number
          other_q2?: number
          other_q3?: number
          poetic_response?: string | null
          poetic_response_encrypted?: string | null
          questionnaire_type?: string
          responsibility_q1?: number | null
          responsibility_q2?: number | null
          responsibility_q3?: number | null
          responsibility_q4?: number | null
          responsibility_q5?: number | null
          share_with_workplace?: boolean
          space_q1?: number
          space_q2?: number
          space_q3?: number
          territory_q1?: number
          territory_q2?: number
          territory_q3?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cancel_at_period_end: boolean | null
          city: string | null
          city_encrypted: string | null
          company_id: string | null
          created_at: string
          full_name: string
          full_name_encrypted: string | null
          id: string
          institution: string | null
          is_encrypted: boolean | null
          origin_city: string | null
          pronoun: string | null
          payment_customer_id: string | null
          payment_subscription_id: string | null
          subscription_end_date: string | null
          updated_at: string
          user_id: string
          user_tier: string
          want_news: boolean
          want_newsletter: boolean
        }
        Insert: {
          avatar_url?: string | null
          cancel_at_period_end?: boolean | null
          city?: string | null
          city_encrypted?: string | null
          company_id?: string | null
          created_at?: string
          full_name: string
          full_name_encrypted?: string | null
          id?: string
          institution?: string | null
          is_encrypted?: boolean | null
          origin_city?: string | null
          pronoun?: string | null
          payment_customer_id?: string | null
          payment_subscription_id?: string | null
          subscription_end_date?: string | null
          updated_at?: string
          user_id: string
          user_tier?: string
          want_news?: boolean
          want_newsletter?: boolean
        }
        Update: {
          avatar_url?: string | null
          cancel_at_period_end?: boolean | null
          city?: string | null
          city_encrypted?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string
          full_name_encrypted?: string | null
          id?: string
          institution?: string | null
          is_encrypted?: boolean | null
          origin_city?: string | null
          pronoun?: string | null
          payment_customer_id?: string | null
          payment_subscription_id?: string | null
          subscription_end_date?: string | null
          updated_at?: string
          user_id?: string
          user_tier?: string
          want_news?: boolean
          want_newsletter?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_codes: {
        Row: {
          code: string
          company_id: string | null
          created_at: string
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          code: string
          company_id?: string | null
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          code?: string
          company_id?: string | null
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "registration_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          affiliate_slug: string | null
          amount: number | null
          created_at: string
          currency: string | null
          id: number
          metadata: Json | null
          status: string | null
          payment_invoice_id: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_slug?: string | null
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: number
          metadata?: Json | null
          status?: string | null
          payment_invoice_id?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_slug?: string | null
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: number
          metadata?: Json | null
          status?: string | null
          payment_invoice_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usage_log: {
        Row: {
          ai_function: string
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          user_id: string
        }
        Insert: {
          ai_function: string
          created_at?: string
          description?: string | null
          duration_seconds: number
          id?: string
          user_id: string
        }
        Update: {
          ai_function?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_annotations: {
        Row: {
          content: string | null
          content_encrypted: string | null
          created_at: string
          id: string
          is_encrypted: boolean | null
          latitude: number
          link: string | null
          link_encrypted: string | null
          longitude: number
          title: string
          title_encrypted: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          content_encrypted?: string | null
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          latitude: number
          link?: string | null
          link_encrypted?: string | null
          longitude: number
          title: string
          title_encrypted?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          content_encrypted?: string | null
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          latitude?: number
          link?: string | null
          link_encrypted?: string | null
          longitude?: number
          title?: string
          title_encrypted?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          created_at: string
          current_period_start: string
          id: string
          minutes_used_this_month: number
          monthly_limit_minutes: number
          total_minutes_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_start?: string
          id?: string
          minutes_used_this_month?: number
          monthly_limit_minutes?: number
          total_minutes_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_start?: string
          id?: string
          minutes_used_this_month?: number
          monthly_limit_minutes?: number
          total_minutes_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_activity_view: {
        Row: {
          activity_type: string | null
          archetype: string | null
          client_city: string | null
          client_name: string | null
          created_at: string | null
          emotional_status: string | null
          gem_category: string | null
          gem_description: string | null
          gem_name: string | null
          language: string | null
          poetic_proposition: string | null
          portal: string | null
          record_id: string | null
          session_city: string | null
          user_id: string | null
          user_tier: string | null
        }
        Relationships: []
      }
      concierge_experts_safe: {
        Row: {
          avatar_url: string | null
          avg_rating: number | null
          bio: string | null
          bio_en: string | null
          bio_es: string | null
          categories: string[] | null
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          instagram: string | null
          is_active: boolean | null
          is_community_verified: boolean | null
          is_cult_approved: boolean | null
          is_feltrip_indicated: boolean | null
          languages: string[] | null
          phone: string | null
          slug: string | null
          specialty: string | null
          total_reviews: number | null
          updated_at: string | null
          verification_date: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          bio_en?: string | null
          bio_es?: string | null
          categories?: string[] | null
          city?: string | null
          created_at?: string | null
          email?: never
          full_name?: string | null
          id?: string | null
          instagram?: string | null
          is_active?: boolean | null
          is_community_verified?: boolean | null
          is_cult_approved?: boolean | null
          is_feltrip_indicated?: boolean | null
          languages?: string[] | null
          phone?: never
          slug?: string | null
          specialty?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          bio_en?: string | null
          bio_es?: string | null
          categories?: string[] | null
          city?: string | null
          created_at?: string | null
          email?: never
          full_name?: string | null
          id?: string | null
          instagram?: string | null
          is_active?: boolean | null
          is_community_verified?: boolean | null
          is_cult_approved?: boolean | null
          is_feltrip_indicated?: boolean | null
          languages?: string[] | null
          phone?: never
          slug?: string | null
          specialty?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_date?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_ai_time: { Args: { p_user_id: string }; Returns: Json }
      check_language_studio_access: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_mrp_limit: { Args: { p_user_id: string }; Returns: Json }
      create_notification: {
        Args: {
          p_actor_id?: string
          p_message: string
          p_related_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      decrypt_sensitive_data: {
        Args: { encrypted_text: string; encryption_key: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { encryption_key: string; plain_text: string }
        Returns: string
      }
      get_company_limits: { Args: { p_company_id: string }; Returns: Json }
      get_notification_preferences_with_email: {
        Args: never
        Returns: {
          created_at: string
          email_notifications: boolean
          pref_id: string
          push_notifications: boolean
          updated_at: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_partners_full: {
        Args: never
        Returns: {
          city: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_remote: boolean
          name: string
          observations: string
          phone: string
          specialty: string
          updated_at: string
          website: string
        }[]
      }
      get_partners_safe: {
        Args: never
        Returns: {
          city: string
          created_at: string
          id: string
          is_active: boolean
          is_remote: boolean
          name: string
          observations: string
          specialty: string
          updated_at: string
          website: string
        }[]
      }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      get_squad_count: { Args: { p_domain: string }; Returns: number }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tier: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_community_via_link: {
        Args: { _slug: string; _user_id: string }
        Returns: string
      }
      join_community_with_code: {
        Args: { _code: string; _user_id: string }
        Returns: string
      }
      purge_user_data: { Args: { p_user_id: string }; Returns: Json }
      set_company_limits: {
        Args: {
          p_company_id: string
          p_mrp_monthly_limit?: number
          p_studio_minutes_limit?: number
        }
        Returns: boolean
      }
      set_user_ai_limit: {
        Args: { p_monthly_limit: number; p_user_id: string }
        Returns: boolean
      }
      use_ai_time: {
        Args: {
          p_ai_function?: string
          p_duration_seconds: number
          p_user_id: string
        }
        Returns: Json
      }
      use_registration_code: {
        Args: { _code: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      users_share_company: {
        Args: { _user_id_1: string; _user_id_2: string }
        Returns: boolean
      }
      validate_invite_link: {
        Args: { p_slug: string }
        Returns: {
          company_id: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "expatriate"
        | "manager"
        | "community_member"
        | "owner"
        | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["expatriate", "manager", "community_member", "owner", "admin"],
    },
  },
} as const
