import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "npm:@aws-sdk/client-bedrock-agent-runtime";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-auth-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// FIX 1: Timeout de 45s — antes do Supabase matar a função nos 60s
// Isso garante que você sempre devolve uma resposta com CORS headers
const BEDROCK_TIMEOUT_MS = 45_000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, sessionId, systemInstruction } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "message é obrigatório", text: "" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const client = new BedrockAgentRuntimeClient({
      region: Deno.env.get("AWS_REGION") || "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!.trim(),
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!.trim(),
      },
    });

    const contextPrefix = systemInstruction ? `[CONTEXTO DO USUÁRIO]\n${systemInstruction}\n\n` : "";
    const dateContext = `[DATA ATUAL: ${today}]`;
    const finalInputText = `${contextPrefix}${dateContext}\n\n${message}`;

    console.log("[CULT-AI] Invocando agente. SessionId:", sessionId, "Input length:", finalInputText.length);

    const command = new InvokeAgentCommand({
      agentId: Deno.env.get("AMAZON_AGENT_ID"),
      agentAliasId: Deno.env.get("AMAZON_AGENT_ALIAS_ID"),
      sessionId: sessionId || `session-${Date.now()}`,
      inputText: finalInputText,
    });

    // FIX 2: Race entre o invoke e um timeout explícito
    // Se o Bedrock demorar demais, você recebe erro claro em vez de 504 sem CORS
    const completionPromise = async (): Promise<string> => {
      const response = await client.send(command);
      let result = "";
      const decoder = new TextDecoder();

      if (response.completion) {
        for await (const event of response.completion) {
          if (event.chunk?.bytes) {
            result += decoder.decode(event.chunk.bytes);
          }
        }
      }
      return result;
    };

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT: Agente demorou mais de 45s")), BEDROCK_TIMEOUT_MS)
    );

    const completion = await Promise.race([completionPromise(), timeoutPromise]);

    // FIX 3: Checar vazio ANTES de enviar, com log para debug
    if (!completion || completion.trim().length === 0) {
      console.error("[CULT-AI] ALERTA: Agente retornou completion vazia. AgentId:", Deno.env.get("AMAZON_AGENT_ID"), "AliasId:", Deno.env.get("AMAZON_AGENT_ALIAS_ID"));
      return new Response(JSON.stringify({ error: "completion_vazia", text: "" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[CULT-AI] Resposta recebida. Chars:", completion.length, "Preview:", completion.slice(0, 80));

    return new Response(JSON.stringify({ text: completion.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    // FIX 4: Log detalhado — diferencia timeout de erro de credencial de erro de rede
    const isTimeout = error.message?.includes("TIMEOUT");
    const isCredential = error.message?.includes("credential") || error.message?.includes("AccessDenied");

    console.error("[CULT-AI-SYSTEM-ERROR]", {
      message: error.message,
      type: isTimeout ? "TIMEOUT" : isCredential ? "CREDENCIAL" : "OUTRO",
      name: error.name,
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        // FIX 5: Texto de erro diferente por tipo — facilita debug no front
        text: isTimeout
          ? "Erro: o oráculo demorou demais para responder."
          : isCredential
          ? "Erro: problema de autenticação com AWS."
          : "Erro na conexão com o oráculo.",
      }),
      {
        status: 200, // mantém 200 para o front não travar
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
```

---

**Agora, o que você precisa fazer no Bedrock Console** (isso resolve o "I'll search..."):

Nas **Instructions** do seu agente, adicione no final:
```
Você SEMPRE responde EXCLUSIVAMENTE em JSON válido. 
Nunca use texto livre, markdown ou explicações fora do JSON.
Nunca diga "I'll search" ou frases introdutórias.
Responda diretamente com o JSON solicitado.