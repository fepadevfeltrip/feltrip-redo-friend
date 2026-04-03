import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PILLAR_NAMES = {
  body: "Body",
  space: "Space", 
  territory: "Territory",
  other: "The Other",
  identity: "Identity",
  responsibility: "Responsibility",
  culture: "Company Culture",
  belonging: "Belonging"
};

const QUESTIONNAIRE_CONTEXT = {
  before_arrival: "This person is preparing to relocate to a new place and is reflecting on their expectations and current state before the journey.",
  during_stay: "This person is currently living abroad and reflecting on their adaptation process in their new environment.",
  departure: "This person is preparing to leave their current location and is reflecting on their experience and the transition ahead."
};

const WORKPLACE_PILLAR_NAMES = {
  space: "Espaço (Physical Work Environment)",
  body: "Corpo (Physical & Emotional Wellbeing at Work)",
  other: "O Outro (Relationships with Colleagues)",
  culture: "Cultura da Empresa (Organizational Culture)",
  belonging: "Pertencimento (Sense of Belonging)",
  responsibility: "Auto-Responsabilidade (Self-Agency & Accountability)"
};

interface UsageCheck {
  minutes_remaining: number;
  monthly_limit: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has remaining time
    const { data: checkData } = await supabase.rpc('check_ai_time', {
      p_user_id: user.id
    } as unknown as undefined);

    const checkResult = checkData as unknown as UsageCheck | null;

    if (checkResult && checkResult.minutes_remaining <= 0) {
      return new Response(JSON.stringify({ 
        error: "Limite de tempo atingido. Seu plano permite " + checkResult.monthly_limit + " minutos/mês.",
        code: "LIMIT_EXCEEDED",
        minutes_remaining: 0
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pillarScores, questionnaireType, freePrompt, pillarFocus, language = 'en' } = await req.json();

    // Input validation: limit freePrompt length
    if (freePrompt && typeof freePrompt === 'string' && freePrompt.length > 1000) {
      return new Response(JSON.stringify({ error: "Prompt too long (max 1000 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const LANGUAGE_NAMES: Record<string, string> = {
      en: "English",
      pt: "Portuguese",
      es: "Spanish",
      fr: "French",
      zh: "Chinese"
    };

    const responseLang = LANGUAGE_NAMES[language] || "English";

    let systemPrompt = "";
    let userPrompt = "";

    if (questionnaireType === "workplace") {
      // WORKPLACE MRP - Dedicated system prompt
      systemPrompt = `You are Boba, a warm, wise, and poetic AI companion from the Feltrip™ methodology.
You help professionals understand their relational presence within their workplace through 6 pillars: Space, Body, The Other, Company Culture, Belonging, and Self-Responsibility.

Your responses MUST be:
- Poetic and evocative, using metaphors and imagery
- Warm and supportive, like a caring mentor
- MAXIMUM 2 paragraphs total (this is strict)
- Written in ${responseLang}

🏢 Workplace Relational Presence Pillars:
- Espaço (Space): How one inhabits and experiences the physical work environment
- Corpo (Body): Physical sensations, energy, wellbeing at work
- O Outro (The Other): Quality of relationships with colleagues and leaders
- Cultura da Empresa (Culture): Alignment with organizational values and practices
- Pertencimento (Belonging): Feeling of being part of, welcomed, included
- Auto-Responsabilidade (Self-Responsibility): Personal agency, ownership, accountability

✨ Poetic Proposition Examples for Workplace:
- Space: "Before your next meeting, pause at the threshold of the room. Notice how the light falls. What does this space ask of you today?"
- Body: "Place both feet flat on the floor beneath your desk. Feel the ground holding you. What tension can you release into this steadiness?"
- The Other: "Think of a colleague whose presence you value. Send them a single sentence of genuine appreciation. What opens in you when you become a giver of recognition?"
- Culture: "Observe one ritual of your organization—a greeting, a meeting, a shared pause. Where do you find yourself in harmony? Where do you feel like a visitor?"
- Belonging: "Remember a moment when you felt truly seen at work. What made that moment possible? What part of you showed up fully?"
- Self-Responsibility: "Name one small action that only you can take today—something no one else will do for you. What shifts when you claim your power to act?"

Always end with a gentle question.`;

      const scoresDescription = Object.entries(pillarScores)
        .map(([pillar, score]) => `${WORKPLACE_PILLAR_NAMES[pillar as keyof typeof WORKPLACE_PILLAR_NAMES] || pillar}: ${score}%`)
        .join("\n");

      userPrompt = `This person completed the Workplace Relational Presence Map.

Their scores (0-100%):
${scoresDescription}

Create a poetic response (MAX 2 paragraphs) that:
1. Acknowledges their strengths (highest scores)
2. Gently addresses areas needing attention (lowest scores)
3. Includes ONE Poetic Proposition for a pillar that needs care
4. Ends with a warm, reflective question`;

    } else {
      // PERSONAL MRP - Original system prompt for expatriate journey
      systemPrompt = `You are Boba, a warm, wise, and poetic AI companion from the Feltrip™ methodology.
You help expatriates and people in transition understand their relational presence through the 5 Feltrip™ pillars: Body, Space, Territory, The Other, and Identity.

Your responses MUST be:
- Poetic and evocative, using metaphors, imagery, and emotional resonance
- Warm and supportive, like a caring friend
- MAXIMUM 2 paragraphs total (this is strict)
- Written in ${responseLang}

🌿 Feltrip™ 5 Pillars:
- Body: sensations, energy, physical adaptation
- Space: private spaces, shelter, comfort
- Territory: city, streets, geography, landscape
- The Other: relationships, social bonds
- Identity: self-image, values, internal narrative

✨ Poetic Proposition Examples:
- Body: "Before you begin your day, place your hand on your chest and notice the rhythm beneath your palm. What part of you is asking to slow down, even if just for a breath?"
- Space: "Choose one corner of your room and rearrange a single object. How does the room breathe when you shift its smallest detail?"
- Territory: "Walk one block in the opposite direction of your usual route. What does the world reveal when you allow surprise to lead?"
- The Other: "Send a brief message to someone you appreciate—just one line of truth. What softens in you when connection is offered without expectation?"
- Identity: "Find a photo of yourself from another chapter of life. What part of that person still lives in you, waiting to be invited back?"

Always end with a gentle question.`;

      if (freePrompt && pillarFocus) {
        userPrompt = `The person wants to talk about the "${PILLAR_NAMES[pillarFocus as keyof typeof PILLAR_NAMES]}" pillar. They shared: "${freePrompt}"
      
Please respond poetically (MAX 2 paragraphs) to their reflection, helping them explore this dimension of their relational presence.`;
      } else if (pillarScores) {
        const context = QUESTIONNAIRE_CONTEXT[questionnaireType as keyof typeof QUESTIONNAIRE_CONTEXT];
        const scoresDescription = Object.entries(pillarScores)
          .map(([pillar, score]) => `${PILLAR_NAMES[pillar as keyof typeof PILLAR_NAMES]}: ${score}%`)
          .join(", ");

        userPrompt = `${context}

Their Relational Presence Map scores (0-100%):
${scoresDescription}

Create a poetic response (MAX 2 paragraphs) that:
1. Acknowledges their strengths (highest scores)
2. Gently addresses areas needing attention (lowest scores)
3. Includes ONE Poetic Proposition for a pillar that needs care
4. Ends with a warm, reflective question`;
      } else {
        throw new Error("Invalid request: missing required parameters");
      }
    }

    console.log("Calling Lovable AI for user:", user.id);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service quota exceeded. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const poeticResponse = data.choices?.[0]?.message?.content || "I sense your journey but couldn't find the words this time. Please try again.";

    // Calculate duration and deduct time
    const durationSeconds = Math.ceil((Date.now() - startTime) / 1000);
    const { data: usageResult } = await supabase.rpc('use_ai_time', {
      p_user_id: user.id,
      p_duration_seconds: Math.max(durationSeconds, 30),
      p_ai_function: 'presence-ai'
    } as unknown as undefined);

    console.log("AI response generated. Duration:", durationSeconds, "s. Usage:", usageResult);

    return new Response(JSON.stringify({ 
      poeticResponse,
      usage: usageResult
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in presence-ai function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});