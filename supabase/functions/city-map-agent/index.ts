import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "npm:@aws-sdk/client-bedrock-agent-runtime";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId } = await req.json();

    const preferredAgentId = Deno.env.get("CITY_MAP_AGENT_ID");
    const preferredAgentAliasId = Deno.env.get("CITY_MAP_AGENT_ALIAS_ID");
    const fallbackAgentId = Deno.env.get("AMAZON_AGENT_ID");
    const fallbackAgentAliasId = Deno.env.get("AMAZON_AGENT_ALIAS_ID");

    if (!preferredAgentId || !preferredAgentAliasId) {
      throw new Error("City Map agent secrets not configured");
    }

    const client = new BedrockAgentRuntimeClient({
      region: Deno.env.get("AWS_REGION") || "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
      },
    });

    const attempts = [{ agentId: preferredAgentId, agentAliasId: preferredAgentAliasId, label: "city-map" }];

    if (
      fallbackAgentId &&
      fallbackAgentAliasId &&
      (fallbackAgentId !== preferredAgentId || fallbackAgentAliasId !== preferredAgentAliasId)
    ) {
      attempts.push({ agentId: fallbackAgentId, agentAliasId: fallbackAgentAliasId, label: "fallback-main" });
    }

    let response: any = null;
    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        console.log(
          `[CITY-MAP-AGENT] Invoking ${attempt.label} agent ${attempt.agentId} alias ${attempt.agentAliasId}`,
        );
        const command = new InvokeAgentCommand({
          agentId: attempt.agentId,
          agentAliasId: attempt.agentAliasId,
          sessionId: sessionId || `citymap-${Date.now()}`,
          inputText: message,
        });
        response = await client.send(command);
        break;
      } catch (err: any) {
        lastError = err;
        console.error(`[CITY-MAP-AGENT] Attempt failed for ${attempt.label}:`, err?.message || err);
      }
    }

    if (!response) {
      throw new Error(lastError?.message || "Failed to invoke Bedrock agent");
    }
    let completion = "";

    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          completion += new TextDecoder().decode(event.chunk.bytes);
        }
      }
    }

    console.log(`[CITY-MAP-AGENT] Raw Response length: ${completion.length}`);

    // --- INÍCIO DO FILTRO DE LIMPEZA DE DADOS (PARSING) ---
    let cleanedCompletion = completion.trim();

    // 1. Intercepta e remove a tag XML <answer> que a orquestração do Bedrock gosta de injetar
    if (cleanedCompletion.includes("<answer>")) {
      const match = cleanedCompletion.match(/<answer>([\s\S]*?)<\/answer>/);
      if (match && match[1]) {
        cleanedCompletion = match[1].trim();
      }
    }

    // 2. Remove blocos de código Markdown (```json ou ```) que quebram o parser do Frontend
    cleanedCompletion = cleanedCompletion
      .replace(/```[a-zA-Z]*\n?/g, "")
      .replace(/```/g, "")
      .trim();

    console.log(`[CITY-MAP-AGENT] Cleaned Response length: ${cleanedCompletion.length}`);
    // --- FIM DO FILTRO DE LIMPEZA ---

    return new Response(JSON.stringify({ text: cleanedCompletion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[CITY-MAP-AGENT] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
