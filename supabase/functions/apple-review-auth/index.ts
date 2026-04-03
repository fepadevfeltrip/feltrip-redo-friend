import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APPLE_REVIEW_EMAIL = "talkawaylanguage@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    // Validate input
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow the specific Apple review tester email
    if (email.toLowerCase().trim() !== APPLE_REVIEW_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the fixed OTP code
    const expectedCode = Deno.env.get("APPLE_REVIEW_OTP_CODE");
    if (!expectedCode || code.trim() !== expectedCode) {
      return new Response(
        JSON.stringify({ error: "Invalid code" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to generate a magic link for the tester
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists, create if not
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    let userId: string | null = null;

    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === APPLE_REVIEW_EMAIL
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create the test user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: APPLE_REVIEW_EMAIL,
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Generate a magic link (returns the link with token)
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: APPLE_REVIEW_EMAIL,
      });

    if (linkError) throw linkError;

    // Extract the token properties to return to the client
    // The client will use signInWithOtp verify flow
    const tokenHash = linkData.properties?.hashed_token;
    
    if (!tokenHash) {
      throw new Error("Failed to generate authentication token");
    }

    return new Response(
      JSON.stringify({ 
        token_hash: tokenHash,
        email: APPLE_REVIEW_EMAIL,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Apple review auth error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
