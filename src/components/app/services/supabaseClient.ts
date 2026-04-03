import { supabase } from "@/integrations/supabase/client";

// Re-export the single unified client
export { supabase };
export const supabaseMain = supabase;

export const isSupabaseConfigured = true;

// --- AUTH ---

// Login via Email OTP only (Google removed for Apple compliance)

// 2. Disparar o Código de 6 dígitos (OTP)
export const sendOtpCode = async (email: string) => {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Cria a conta se for usuário novo
    },
  });
};

// 3. Validar o Código de 6 dígitos que o usuário digitou
export const verifyOtpCode = async (email: string, token: string) => {
  return await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
};

// Mantemos o reset de senha caso algum usuário antigo ainda tente usar
export const sendPasswordResetEmail = async (email: string) =>
  await supabase.auth.resetPasswordForEmail(email, {
    // CORREÇÃO AQUI TAMBÉM:
    redirectTo: window.location.origin,
  });
// --- DB OPERATIONS ---

export const saveMRPSession = async (data: any) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const sessionData = {
      user_id: user?.id || data.user_id || null,
      scores: data.scores,
      emotional_status: data.emotional_status || data.emotionalStatus,
      poetic_proposition: data.poetic_proposition || data.poeticProposition,
      city: data.city || data.cidade,
      portal: data.portal,
      profile: data.profile,
      language: data.language || "pt",
      is_public: data.is_public ?? false,
    };

    const { data: session, error } = await supabase.from("mrp_sessions").insert([sessionData]).select();

    if (error) {
      console.error("ERRO SUPABASE (Sessão):", error.message);
      return null;
    }

    return session && session.length > 0 ? session[0] : null;
  } catch (err) {
    console.error("Erro ao salvar sessão:", err);
    return null;
  }
};

export const saveGem = async (gemData: any) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const dbData = {
      session_id: gemData.session_id,
      user_id: user?.id || gemData.user_id || null,
      name: String(gemData.name || "Nova Descoberta"),
      description: String(gemData.description || ""),
      address: String(gemData.address || ""),
      lat: gemData.lat,
      lng: gemData.lng,
      pin_color: gemData.pin_color,
      cidade: gemData.cidade || gemData.city,
      categoria_principal: gemData.categoria_principal,
      dna_raiz: gemData.dna_raiz || gemData.dna?.raiz || 0,
      dna_cult: gemData.dna_cult || gemData.dna?.cult || 0,
      dna_luxo: gemData.dna_luxo || gemData.dna?.luxo || 0,
      dna_espiritual: gemData.dna_espiritual || gemData.dna?.spiritual || 0,
      dna_criativo: gemData.dna_criativo || gemData.dna?.criativo || 0,
      camada_emocional: gemData.camada_emocional || [],
      acesso: gemData.acesso || gemData.logistica?.acesso,
      movimento: gemData.movimento || gemData.logistica?.movimento,
      turno_ideal: gemData.turno_ideal || gemData.logistica?.turno_ideal,
      is_carnaval: gemData.is_carnaval || gemData.temporalidade?.is_carnaval || false,
      expira_em: gemData.expira_em || gemData.temporalidade?.expira_em,
      proposicao_poetica: gemData.proposicao_poetica || gemData.proposicaoPoetica,
    };

    console.log("[saveGem] Inserindo gem:", dbData.name, "session:", dbData.session_id, "user:", dbData.user_id);

    const { data, error } = await supabase.from("mrp_gems").insert([dbData]).select();

    if (error) {
      console.error("[saveGem] ERRO SUPABASE:", error.message, error.details, error.hint);
      return null;
    }
    console.log("[saveGem] Gem salva com sucesso:", data?.[0]?.id);
    return data ? data[0] : null;
  } catch (err) {
    console.error("[saveGem] Erro ao salvar gema:", err);
    return null;
  }
};

export const getUserHistory = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: sessions, error: sessionError } = await supabase
      .from("mrp_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (sessionError) throw sessionError;

    const sessionIds = sessions.map((s) => s.id);
    let gems: any[] = [];

    if (sessionIds.length > 0) {
      const { data: gemData, error: gemError } = await supabase
        .from("mrp_gems")
        .select("*")
        .in("session_id", sessionIds);

      if (!gemError && gemData) {
        gems = gemData;
      }
    }

    return sessions.map((session) => ({
      ...session,
      gems: gems.filter((g) => g.session_id === session.id),
    }));
  } catch (err) {
    console.error("Erro no histórico:", err);
    return [];
  }
};

export const updateSessionUser = async (sessionId: string, userId: string) => {
  const { data: sessionData, error: sessionError } = await supabase
    .from("mrp_sessions")
    .update({ user_id: userId })
    .eq("id", sessionId)
    .select();

  const { error: gemsError } = await supabase.from("mrp_gems").update({ user_id: userId }).eq("session_id", sessionId);

  if (sessionError || gemsError) {
    console.error("Erro ao vincular sessão/gemas ao usuário:", {
      sessionError: sessionError?.message,
      gemsError: gemsError?.message,
      sessionId,
      userId,
    });
    return null;
  }

  return sessionData;
};

export const deleteMRPSession = async (sessionId: string) => {
  try {
    await supabase.from("mrp_gems").delete().eq("session_id", sessionId);
    const { error } = await supabase.from("mrp_sessions").delete().eq("id", sessionId);
    return !error;
  } catch (error) {
    return false;
  }
};

export const saveFeedback = async (sessionId: string, rating: number, comment: string) => {
  await supabase.from("mrp_feedback").insert([{ session_id: sessionId, rating, comment }]);
};
