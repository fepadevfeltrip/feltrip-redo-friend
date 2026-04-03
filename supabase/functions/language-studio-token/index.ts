import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const studioSecret = Deno.env.get("LANGUAGE_STUDIO_SECRET");

    if (!studioSecret) {
      throw new Error("LANGUAGE_STUDIO_SECRET not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client for querying family members
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is a family member - if so, use primary user's quota
    let quotaUserId = user.id;
    
    const { data: familyMember } = await supabaseAdmin
      .from('family_members')
      .select('primary_user_id')
      .eq('user_id', user.id)
      .single();

    if (familyMember?.primary_user_id) {
      // User is a family member, get the primary user's auth ID from their profile
      const { data: primaryProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('id', familyMember.primary_user_id)
        .single();
      
      if (primaryProfile?.user_id) {
        quotaUserId = primaryProfile.user_id;
        console.log(`User ${user.id} is a family member, using primary user ${quotaUserId} quota`);
      }
    }

    // Check if user/family has AI time remaining
    const { data: usageData } = await supabaseAdmin.rpc('check_ai_time', { p_user_id: quotaUserId });
    const usage = usageData as { minutes_remaining: number } | null;
    
    if (!usage || usage.minutes_remaining <= 0) {
      return new Response(JSON.stringify({ error: "No AI time remaining" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate token with expiration (15 minutes)
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const payload = {
      userId: user.id,
      quotaUserId: quotaUserId,
      email: user.email,
      expiresAt,
      minutesRemaining: usage.minutes_remaining,
    };

    // Create HMAC signature
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(studioSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, data);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Token = base64(payload).base64(signature)
    const payloadBase64 = btoa(JSON.stringify(payload));
    const token = `${payloadBase64}.${signatureBase64}`;

    console.log(`Token generated for user ${user.id}, quota from ${quotaUserId}, expires at ${new Date(expiresAt).toISOString()}`);

    return new Response(JSON.stringify({ token, expiresAt, quotaUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
